# Investigating Minecraft Bedrock NetherNet Connectivity on Oracle Cloud

## Summary

This case study shows a client connectivity issue I encountered while running Minecraft Bedrock Dedicated Server 1.26.61.1 through Box64 on an Oracle Cloud ARM64 instance running Ubuntu.

Although the server appeared to be running normally, the Minecraft client was unable to connect. I investigated the network configuration and analyzed packet captures, which led me to explore NetherNet, Minecraft Bedrock's WebRTC-based networking transport, and its use of NAT traversal, Interactive Connectivity Establishment (ICE), and Session Traversal Utilities for NAT (STUN).

The investigation revealed a difference in the ICE candidates advertised by the server before and after a configuration change. Initially, the server's Session Description Protocol (SDP) response advertised its private IP address. After explicitly configuring the public IP address and UDP port range, the SDP included a public server-reflexive candidate. Subsequent packet captures showed successful STUN connectivity checks and a DTLS handshake, followed by a successful game connection.

This report documents the troubleshooting process, the observed network behavior, and what I learned about how NAT, ICE, STUN, SDP, and DTLS work together to establish connectivity.

## Environment and Initial Problem

The environment consisted of the following:

| Component | Configuration |
|---|---|
| Game server | Minecraft Bedrock Dedicated Server 1.26.61.1 |
| Hosting platform | Oracle Cloud Infrastructure (OCI) |
| Operating system | Ubuntu on ARM64 |
| Compatibility layer | Box64 |
| Server private IP | `10.0.0.53` |
| Server public IP | `147.224.x.x` |
| Client private IP | `192.168.1.154` |
| Network transport | NetherNet |
| TCP signaling port | `19135` |
| Configured UDP range | `20001–20011` |

After learning that RakNet was deprecated in Minecraft Bedrock Edition 26.60 ([Minecraft Bedrock 26.60 changelog](https://www.minecraft.net/en-us/article/minecraft--bedrock-edition-26-60-changelog)), I updated the server transport protocol to NetherNet. However, the client still failed to join, even though the client machine could ping the server and TCP connectivity to the dedicated game server port was working.

The Minecraft client displayed the named errors **Terracotta** and **Door**, which are associated with unspecified errors and multiplayer connectivity issues, respectively ([Minecraft Named Error Code Troubleshooting](https://help.minecraft.net/hc/en-us/articles/38555497091469-Named-Error-Code-Troubleshooting-for-Minecraft-Bedrock-Edition)). Since neither error identified a specific network failure, I began investigating the server's network configuration and traffic.

## Initial Troubleshooting

I started by checking the server's listening ports, Oracle Cloud network security rules, Ubuntu firewall rules, and TCP connectivity. Using `tcpdump`, I confirmed that TCP connections from the client reached the server, while the server logs showed no errors or warnings during the connection attempts. This suggested that basic TCP connectivity was functioning, but it did not establish whether the separate UDP transport used by NetherNet was working.

While examining the listening ports, I also noticed UDP port `7751`, which I initially associated with LAN discovery. This prompted me to capture UDP traffic and investigate what happened after the initial TCP connection.

## Packet Capture Observations

During the initial UDP capture, I observed repeated STUN Binding Requests originating from the OCI instance's private IP address (`10.0.0.53`) and targeting the Minecraft client's private IP address (`192.168.1.154`). The following table shows a simplified excerpt of the captured traffic.

| Source | Destination | Protocol | Length | Info |
|---|---|---|---|---|
| 10.0.0.53 | 192.168.1.154 | STUN | 138 | Binding Request |
| 10.0.0.53 | 192.168.1.154 | STUN | 138 | Binding Request |
| 10.0.0.53 | 192.168.1.154 | STUN | 138 | Binding Request |
| 10.0.0.53 | 192.168.1.154 | STUN | 138 | Binding Request |
| 10.0.0.53 | 192.168.1.154 | STUN | 138 | Binding Request |

No corresponding successful responses were observed for these requests. STUN is used in NAT traversal, including discovering NAT-mapped addresses and performing ICE connectivity checks. In this case, the server was attempting to reach the client's private IP address on a separate network, which was not directly reachable over the public Internet.

I observed similar behavior from the client side. During the connection process, Minecraft displayed a prompt asking whether to **Trust** the server. After accepting the prompt, the client generated STUN Binding Requests targeting `10.0.0.53`, the OCI instance's private IP address. Because this address belonged to the server's private cloud network, the remote client could not ordinarily reach it directly.

These observations suggested that both endpoints were attempting connectivity checks using private addresses that were not mutually reachable. To understand why this was happening, I looked more closely at how NetherNet establishes network connections.

## Understanding NAT, ICE, STUN, and SDP

NetherNet uses WebRTC-based networking to connect the Minecraft client and server. Unlike a simple TCP connection, this process involves negotiating a usable network path between endpoints, particularly when one or both are behind Network Address Translation (NAT).

NAT allows devices using private IP addresses to communicate with external networks through translated addresses and ports. Both the Minecraft client and the OCI instance operated in NAT environments, meaning their private addresses were not directly reachable from the public Internet.

To establish connectivity in these environments, WebRTC uses **Interactive Connectivity Establishment (ICE)**, which discovers and tests possible network paths between endpoints. These paths are represented by ICE candidates, including local host addresses, server-reflexive addresses representing NAT-mapped endpoints, and relay addresses.

**STUN (Session Traversal Utilities for NAT)** is used during ICE candidate discovery and connectivity checks. By exchanging STUN Binding Requests and Responses, endpoints can determine whether a particular candidate pair provides a usable network path.

The information needed for this negotiation is communicated through **Session Description Protocol (SDP)**. SDP describes connection parameters such as ICE candidates, ICE credentials, and DTLS-related information. In the captured NetherNet session, SDP information was exchanged through HTTP signaling.

### Initial SDP Observation

When I examined the server's SDP response in the client's packet capture, I found the following ICE candidate:

```text
candidate:1937594153 1 udp 2122260223 10.0.0.53 41891 typ host generation 0 network-id 1 network-cost 50
```

The important fields are:

| Field | Value | Meaning |
|---|---|---|
| Transport | `udp` | UDP transport |
| IP address | `10.0.0.53` | Server's private IP address |
| Port | `41891` | Candidate UDP port |
| Candidate type | `host` | Candidate associated with a local network interface |

The candidate type was `host`, meaning the server was advertising an address associated with one of its local network interfaces. In this case, the address was `10.0.0.53`, the private IP address assigned to the OCI instance.

Since the Minecraft client was connecting from a different network, it could not directly reach this address over the public Internet. This was consistent with the unsuccessful STUN connectivity checks observed in the packet captures, where the client attempted to communicate with the server's private address.

### ICE Credentials and Trickle ICE

The same SDP response also contained several attributes associated with ICE negotiation:

```text
a=ice-ufrag:wiRz
a=ice-pwd:[REDACTED]
a=ice-options:trickle
```

These attributes have different purposes:

| Attribute | Purpose |
|---|---|
| `ice-ufrag` | A username fragment used to identify an ICE generation and associate STUN connectivity checks with the appropriate ICE credentials |
| `ice-pwd` | A session-specific password used for STUN message integrity verification |
| `ice-options:trickle` | Advertises support for Trickle ICE, allowing ICE candidates to be exchanged incrementally |

The `ice-ufrag` and `ice-pwd` values are used during ICE connectivity checks. For example, the `USERNAME` attribute in a STUN Binding Request typically combines the remote and local ICE username fragments into a colon-separated value. This allows the receiving endpoint to identify the appropriate ICE session, while the password is used to verify message integrity. These credentials are separate from the cryptographic keys used later by DTLS.

The `ice-options:trickle` attribute was particularly interesting because it indicates support for **Trickle ICE**. In a conventional ICE exchange without trickling, an endpoint generally gathers its candidates before exchanging the initial candidate information. Trickle ICE allows endpoints to begin negotiating earlier and communicate additional candidates as they become available.

For example, an endpoint might initially advertise a local host candidate and later discover a server-reflexive candidate representing its NAT-mapped public address. This means that an initial SDP response containing only a private host candidate does not necessarily represent the complete candidate list for the entire connection attempt.

In this investigation, the examined initial SDP response advertised the server's private address (`10.0.0.53:41891`), and the captured STUN connectivity checks involving private addresses did not succeed. However, the presence of `ice-options:trickle` means I cannot conclude from that response alone that NetherNet never discovered or exchanged a public candidate. The attribute indicates support for incremental candidate exchange, but it does not prove that additional candidates were actually sent.

Determining whether further candidates were exchanged would require examining the complete signaling sequence, including any subsequent candidate updates. Therefore, the available evidence supports a connectivity failure involving unreachable private candidate pairs, but does not conclusively establish why a usable public candidate was unavailable during the unsuccessful attempts.

## Configuration Change

While researching similar connectivity issues, I found a report in Mojang's bug tracker: [BDS-23130](https://report.bugs.mojang.com/servicedesk/customer/portal/4/BDS-23130).

Following the suggested workaround, I explicitly configured the server's public IP address and UDP port range in `server.properties`:

```properties
server-udp-ports=147.224.x.x:20001-20011:20001-20011
```

I also allowed the corresponding UDP port range (`20001–20011`) through Oracle Cloud's network security rules and the Ubuntu iptables firewall. After applying these changes and restarting the server, I repeated the connection attempt and captured the network traffic again.

### SDP After the Configuration Change

The server's SDP response now included the following candidate:

```text
candidate:1904726067 1 udp 1686052607 147.224.x.x 20001 typ srflx raddr 10.0.0.53 rport 20001 generation 0 network-id 1 network-cost 50
```

Unlike the initial response, this candidate was identified as `srflx`, or **server-reflexive**, and advertised the server's public IP address.

| Field | Value | Meaning |
|---|---|---|
| Transport | `udp` | UDP transport |
| IP address | `147.224.x.x` | Server's public IP address |
| Port | `20001` | Publicly advertised UDP port |
| Candidate type | `srflx` | Server-reflexive candidate |
| Related address (`raddr`) | `10.0.0.53` | Related private address |
| Related port (`rport`) | `20001` | Related local port |

The `raddr` and `rport` fields identified the related private endpoint, while the candidate itself advertised the public address and port that the remote client could attempt to reach.

This was the most significant observable difference between the initial and working SDP responses. Instead of relying only on the private host candidate shown in the earlier capture, the client now had a publicly reachable candidate to test.

## Successful STUN Connectivity Checks and DTLS Handshake

After the configuration change, the client began sending STUN Binding Requests to the server's public IP address. Unlike the earlier attempts involving private addresses, the new packet capture showed successful STUN responses followed by DTLS traffic.

| Source | Destination | Protocol | Length | Info |
|---|---|---|---|---|
| 192.168.1.154 | 147.224.x.x | STUN | 142 | Binding Request |
| 147.224.x.x | 192.168.1.154 | STUN | 106 | Binding Success Response — XOR-MAPPED-ADDRESS: 24.24.x.x:59064 |
| 147.224.x.x | 192.168.1.154 | STUN | 138 | Binding Request |
| 192.168.1.154 | 147.224.x.x | STUN | 106 | Binding Success Response — XOR-MAPPED-ADDRESS: 147.224.x.x:20001 |
| 192.168.1.154 | 147.224.x.x | STUN | 142 | Binding Request |
| 147.224.x.x | 192.168.1.154 | DTLSv1.2 | 242 | Client Hello |
| 192.168.1.154 | 147.224.x.x | DTLSv1.2 | 689 | Server Hello, Certificate, Server Key Exchange, Certificate Request, Server Hello Done |

The STUN Binding Success Responses demonstrated that the endpoints could exchange connectivity-check messages over the public network path. The responses also contained `XOR-MAPPED-ADDRESS` attributes, which identify the source address and port as observed by the responding endpoint. These values are encoded using an XOR operation, which provides obfuscation rather than encryption.

In this capture, the mapped addresses included the client's NAT-mapped public address and the server's public address. This indicated that the endpoints were successfully communicating through their respective NAT environments.

Following the successful STUN exchanges, the capture showed a **DTLS (Datagram Transport Layer Security)** handshake. DTLS provides TLS-style security for datagram-based communication such as UDP, allowing application traffic to be protected without requiring TCP's reliable, ordered transport.

The appearance of DTLS traffic indicated that the connection had progressed beyond the initial ICE connectivity checks into secure transport negotiation. The Minecraft client was subsequently able to join the server successfully.

## Findings and Limitations

The investigation showed that basic TCP reachability was not sufficient for NetherNet connectivity. Although the Minecraft server accepted TCP connections, the initial packet captures showed unsuccessful STUN checks involving private IP addresses. The examined SDP response also advertised the server's private host candidate, which was not directly reachable from the remote client.

After explicitly configuring the public IP address and UDP port range, the server advertised a public server-reflexive candidate. Subsequent captures showed successful STUN Binding Responses and DTLS traffic, followed by a successful game connection. These observations establish a clear difference in network behavior before and after the configuration changes.

However, the investigation does not conclusively establish why a usable public candidate was not advertised in the initial SDP response. Because the server supported Trickle ICE, additional candidates could potentially have been exchanged later, and I did not establish whether this occurred during the unsuccessful attempts.

There were also limitations in the test environment. The server ran through Box64, allowing the x86-64 Minecraft Bedrock Dedicated Server binary to execute on ARM64. Although this compatibility layer could introduce differences compared with native x86-64 environments, I found no evidence that Box64 caused the connectivity issue.

## Final Thoughts

This investigation helped me understand why basic network connectivity does not necessarily mean an application can establish a usable session. Although the Minecraft server was reachable over TCP, NetherNet required a separate UDP communication path, and the initial ICE connectivity checks involved private addresses that were not directly reachable between the two networks.

Examining the SDP responses helped explain what the endpoints were attempting to do. The initial response advertised a private host candidate, while the working configuration advertised a public server-reflexive candidate. The presence of `ice-options:trickle` was also an important reminder that a single SDP response might not represent the complete ICE candidate exchange, making it necessary to distinguish what was observed from what remained uncertain.

After configuring the public IP address and UDP port range, the packet captures showed successful STUN connectivity checks followed by a DTLS handshake, and the Minecraft client was able to join the server. Although this does not establish the precise root cause of the initial failure, the evidence helped narrow the investigation from general network reachability to the connectivity negotiation process.

Another observation was that the NetherNet signaling exchange used HTTP rather than HTTPS in this environment. The SDP contained ICE candidate addresses, ICE credentials, and DTLS-related parameters, including a certificate fingerprint. Although the subsequent game communication used DTLS, the signaling exchange itself was not encrypted in the captured traffic. This raises considerations about signaling confidentiality and integrity, although I did not evaluate whether additional application-level protections were present.

Overall, the troubleshooting process provided a practical opportunity to understand how NAT, ICE, STUN, SDP, and DTLS work together. More importantly, it demonstrated how packet-level evidence can help investigate an application connectivity issue that initially appeared to be a simple firewall or server configuration problem.

## Acknowledgment

This investigation was conducted with AI-assisted troubleshooting. ChatGPT helped suggest diagnostic commands, interpret packet captures, and explain networking protocols. All observations and configuration changes were tested in my own environment.

The process was a valuable hands-on learning experience, particularly in understanding how ICE, STUN, SDP, and DTLS work together in network connectivity.

## Commands Used During Investigation

The following Linux commands were useful for troubleshooting network connectivity, capturing traffic, and configuring the firewall on the Oracle Cloud instance.

### Checking Network Connectivity

```bash
# Show listening TCP and UDP ports
sudo ss -tulnp

# Check network interfaces and IP addresses
ip addr

# Check routing
ip route

# Check server logs
tail -f server.log
```

### Capturing Network Traffic

```bash
# Capture TCP signaling traffic
sudo tcpdump -ni any 'tcp port 19135'

# Capture UDP traffic
sudo tcpdump -ni any udp

# Capture STUN traffic for analysis in Wireshark
sudo tcpdump -ni any -s 0 -w stun.pcap 'udp'

# Capture traffic from a specific client public IP
sudo tcpdump -ni any 'host <CLIENT_PUBLIC_IP>'
```

### Checking and Configuring Ubuntu Firewall (iptables)

```bash
# List firewall rules with line numbers
sudo iptables -L INPUT -n -v --line-numbers

# Allow NetherNet TCP signaling
sudo iptables -A INPUT -p tcp --dport 19135 -j ACCEPT

# Allow UDP game transport
sudo iptables -A INPUT -p udp --dport 20001:20011 -j ACCEPT

# Replace an existing UDP rule (example: rule 7)
sudo iptables -R INPUT 7 -p udp --dport 20001:20011 -j ACCEPT
```

The corresponding TCP and UDP ports also needed to be permitted in Oracle Cloud's network security rules.

### Configuring Minecraft Bedrock Dedicated Server

The following setting was added to `server.properties`:

```properties
server-udp-ports=<SERVER_PUBLIC_IP>:20001-20011:20001-20011
```

The server was restarted after applying the configuration.

### Analyzing Packet Captures

Wireshark display filters used to inspect the connection process:

```text
stun
```

```text
sdp
```

```text
dtls
```

```text
tcp.port == 19135
```

```text
udp.port >= 20001 && udp.port <= 20011
```

These filters helped identify the SDP ICE candidates, STUN Binding Requests and Responses, and subsequent DTLS handshake.