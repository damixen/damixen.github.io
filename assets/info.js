const INFO_CONTENT = {
  topASOrganizations: {
    title: "Top AS Organizations",

    what:
      "Organizations associated with observed source IP addresses, based on their Autonomous System Number (ASN).",

    why:
      "IP addresses can be ephemeral and may change over time, while an Autonomous System Number (ASN) provides a more persistent view of the network organization behind observed activity. This makes AS information useful for identifying broader patterns across cloud providers, hosting companies, ISPs, and other networks. It does not mean the organization itself is responsible for the observed activity.",
  },

  honeypots: {
    Cowrie: {
      title: "Cowrie",

      what:
        "Cowrie is a medium-interaction honeypot that emulates SSH and Telnet services and records activity from clients interacting with those services.",

      why:
        "SSH and Telnet are commonly exposed services. Cowrie provides visibility into authentication attempts, interactive sessions, commands, and file activity.",

      github:
        "https://github.com/cowrie/cowrie",
    },

    Dionaea: {
      title: "Dionaea",

      what:
        "Dionaea is a honeypot designed to emulate network services and capture activity directed at vulnerable services and protocols.",

      why:
        "Dionaea helps observe automated service discovery, connection attempts, protocol activity, and other interactions against commonly targeted network services.",

      github:
        "https://github.com/DinoTools/dionaea",
    },

    Sentrypeer: {
      title: "SentryPeer",

      what:
        "SentryPeer is a SIP honeypot and VoIP security tool that observes SIP traffic and records information about callers and SIP requests.",

      why:
        "SIP services exposed to the internet can receive automated scanning and unsolicited VoIP activity. SentryPeer provides visibility into this type of network activity.",

      github:
        "https://github.com/SentryPeer/SentryPeer",
    },

    Heralding: {
      title: "Heralding",

      what:
        "Heralding is a credential-catching honeypot that emulates several network services and records authentication attempts.",

      why:
        "It provides visibility into automated authentication activity and the usernames being attempted against exposed services.",

      github:
        "https://github.com/johnnykv/heralding",
    },

    Tanner: {
      title: "Tanner",

      what:
        "Tanner is a web application honeypot designed to emulate vulnerable web applications and collect information about HTTP requests and interactions.",

      why:
        "It helps observe automated web scanning, probing, and attempts to interact with vulnerable web application behavior.",

      github:
        "https://github.com/robertswiecki/tanner",
    },

    Adbhoney: {
      title: "Adbhoney",

      what:
        "Adbhoney is an Android Debug Bridge (ADB) honeypot that emulates an exposed ADB service.",

      why:
        "Exposed ADB services can be discovered and probed by automated internet scanners. Adbhoney provides visibility into those interactions.",

      github:
        "https://github.com/huuck/Adbhoney",
    },

    Redishoneypot: {
      title: "Redishoneypot",

      what:
        "Redishoneypot is a honeypot that emulates the Redis protocol and records interactions with the service.",

      why:
        "Redis instances that are exposed without appropriate protection can be discovered by automated scanners. This honeypot helps observe those connection attempts and interactions.",

      github:
        "https://github.com/cypwnpwn/Redishoneypot",
    },

    Wordpot: {
      title: "Wordpot",

      what:
        "Wordpot is a low-interaction WordPress honeypot that emulates aspects of a WordPress installation.",

      why:
        "WordPress is widely deployed and frequently scanned for known paths, plugins, and vulnerable endpoints. Wordpot helps capture this type of web activity.",

      github:
        "https://github.com/abdilahrf/Wordpot",
    },
  }, metrics: {
    cowrie: {
      eventTypes: {
        title: "Event Types",
        what:
          "Categories of interactions recorded by Cowrie, such as connection, authentication, session, and other activity.",
        why:
          "They provide a high-level view of how clients interact with the honeypot.",
      },

      commands: {
        title: "Commands",
        what:
          "Commands entered during interactive sessions.",
        why:
          "These can provide insight into what a client attempted to do after establishing a session.",
      },

      downloads: {
        title: "Downloads",
        what:
          "Files or payloads requested or transferred during a session.",
        why:
          "They can help identify files or payloads that clients attempted to retrieve or transfer.",
      },

      files: {
        title: "Files",
        what:
          "File-related activity observed during sessions, such as files created, accessed, or transferred.",
        why:
          "File activity can provide additional context about what occurred during an interactive session.",
      },

      sshClientFingerprints: {
        title: "SSH Client Fingerprints",
        what:
          "Identifiers derived from characteristics of SSH clients.",
        why:
          "They can help group activity from clients with similar SSH configurations.",
        note:
          "The fingerprint is based on characteristics of the SSH client, such as its version information and supported SSH algorithms.",
      },

      credentials: {
        title: "Credentials",
        what:
          "Usernames observed in authentication attempts.",
        why:
          "They can show commonly attempted usernames and help identify credential patterns.",
        note:
          "Their presence does not indicate that authentication was successful.",
      },
    },
    sentrypeer: {
      sipMethods: {
        title: "SIP Methods",
        what:
          "Types of SIP requests observed by SentryPeer, such as INVITE, REGISTER, and OPTIONS.",
        why:
          "They provide insight into how clients are interacting with the SIP service.",
      },

      sipUserAgents: {
        title: "SIP User Agents",
        what:
          "Software or device identifiers reported in SIP requests.",
        why:
          "They can help identify and group different SIP clients, scanners, and VoIP software involved in observed activity.",
      },

      sourceActivity: {
        title: "Source Activity",
        what:
          "Activity grouped by source IP address, including the number of events and unique called numbers observed.",
        why:
          "It helps show which sources generated the most SIP activity and whether they interacted with multiple numbers.",
        note:
          "Some events do not contain a called-number value, and values may not represent normalized telephone numbers.",

      },
    },
    dionaea: {
      protocols: {
        title: "Protocols",
        what:
          "Network protocols observed in Dionaea activity.",
        why:
          "They show which types of network services or protocols generated activity against the honeypot.",
      },

      credentials: {
        title: "Credentials",
        what:
          "Usernames observed in authentication attempts.",
        why:
          "They can show commonly attempted usernames and help identify credential patterns against services emulated by Dionaea.",
        note:
          "The presence of a username does not indicate that authentication was successful.",
      },
    },
  },
};