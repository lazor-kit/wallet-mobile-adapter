/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/lazorkit.json`.
 */
export type Lazorkit = {
  "address": "9gJ7jZaAvUafgTFPoqkCwbuvC9kpZCPtHfHjMkQ66wu9",
  "metadata": {
    "name": "lazorkit",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "docs": [
    "The Lazor Kit program provides smart wallet functionality with passkey authentication"
  ],
  "instructions": [
    {
      "name": "createSmartWallet",
      "docs": [
        "Create a new smart wallet with passkey authentication"
      ],
      "discriminator": [
        129,
        39,
        235,
        18,
        132,
        68,
        203,
        19
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "smartWalletSeq",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  109,
                  97,
                  114,
                  116,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                  95,
                  115,
                  101,
                  113
                ]
              }
            ]
          }
        },
        {
          "name": "smartWallet",
          "docs": [
            "It is initialized with 0 space because its data is stored in SmartWalletConfig."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  109,
                  97,
                  114,
                  116,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "smart_wallet_seq.seq",
                "account": "smartWalletSeq"
              }
            ]
          }
        },
        {
          "name": "smartWalletConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  109,
                  97,
                  114,
                  116,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "smartWallet"
              }
            ]
          }
        },
        {
          "name": "smartWalletAuthenticator",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  109,
                  97,
                  114,
                  116,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  101,
                  110,
                  116,
                  105,
                  99,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "smartWallet"
              },
              {
                "kind": "arg",
                "path": "passkey_pubkey.to_hashed_bytes(smart_wallet"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "passkeyPubkey",
          "type": {
            "array": [
              "u8",
              33
            ]
          }
        },
        {
          "name": "credentialId",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "executeInstruction",
      "docs": [
        "Execute an instruction with passkey authentication"
      ],
      "discriminator": [
        48,
        18,
        40,
        40,
        75,
        74,
        147,
        110
      ],
      "accounts": [
        {
          "name": "payer",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "smartWallet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  109,
                  97,
                  114,
                  116,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "smart_wallet_config.id",
                "account": "smartWalletConfig"
              }
            ]
          }
        },
        {
          "name": "smartWalletConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  109,
                  97,
                  114,
                  116,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "smartWallet"
              }
            ]
          }
        },
        {
          "name": "smartWalletAuthenticator",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  109,
                  97,
                  114,
                  116,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  101,
                  110,
                  116,
                  105,
                  99,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "smartWallet"
              },
              {
                "kind": "arg",
                "path": "args.passkey_pubkey.to_hashed_bytes(smart_wallet"
              }
            ]
          }
        },
        {
          "name": "ixSysvar",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "cpiProgram",
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "executeInstructionArgs"
            }
          }
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the program by creating the sequence tracker"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "smartWalletSeq",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  109,
                  97,
                  114,
                  116,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                  95,
                  115,
                  101,
                  113
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "smartWalletAuthenticator",
      "discriminator": [
        126,
        36,
        85,
        166,
        77,
        139,
        221,
        129
      ]
    },
    {
      "name": "smartWalletConfig",
      "discriminator": [
        138,
        211,
        3,
        80,
        65,
        100,
        207,
        142
      ]
    },
    {
      "name": "smartWalletSeq",
      "discriminator": [
        12,
        192,
        82,
        50,
        253,
        49,
        195,
        84
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "passkeyMismatch",
      "msg": "Passkey public key mismatch with stored authenticator"
    },
    {
      "code": 6001,
      "name": "smartWalletMismatch",
      "msg": "Smart wallet address mismatch with authenticator"
    },
    {
      "code": 6002,
      "name": "authenticatorNotFound",
      "msg": "Smart wallet authenticator account not found or invalid"
    },
    {
      "code": 6003,
      "name": "secp256r1InvalidLength",
      "msg": "Secp256r1 instruction has invalid data length"
    },
    {
      "code": 6004,
      "name": "secp256r1HeaderMismatch",
      "msg": "Secp256r1 instruction header validation failed"
    },
    {
      "code": 6005,
      "name": "secp256r1DataMismatch",
      "msg": "Secp256r1 signature data validation failed"
    },
    {
      "code": 6006,
      "name": "secp256r1InstructionNotFound",
      "msg": "Secp256r1 instruction not found at specified index"
    },
    {
      "code": 6007,
      "name": "invalidSignature",
      "msg": "Invalid signature provided for passkey verification"
    },
    {
      "code": 6008,
      "name": "clientDataInvalidUtf8",
      "msg": "Client data JSON is not valid UTF-8"
    },
    {
      "code": 6009,
      "name": "clientDataJsonParseError",
      "msg": "Client data JSON parsing failed"
    },
    {
      "code": 6010,
      "name": "challengeMissing",
      "msg": "Challenge field missing from client data JSON"
    },
    {
      "code": 6011,
      "name": "challengeBase64DecodeError",
      "msg": "Challenge base64 decoding failed"
    },
    {
      "code": 6012,
      "name": "challengeDeserializationError",
      "msg": "Challenge message deserialization failed"
    },
    {
      "code": 6013,
      "name": "timestampTooOld",
      "msg": "Message timestamp is too far in the past"
    },
    {
      "code": 6014,
      "name": "timestampTooNew",
      "msg": "Message timestamp is too far in the future"
    },
    {
      "code": 6015,
      "name": "slotTooOld",
      "msg": "Message slot is too far in the past"
    },
    {
      "code": 6016,
      "name": "slotTooNew",
      "msg": "Message slot is too far in the future"
    },
    {
      "code": 6017,
      "name": "nonceMismatch",
      "msg": "Nonce mismatch: expected different value"
    },
    {
      "code": 6018,
      "name": "nonceOverflow",
      "msg": "Nonce overflow: cannot increment further"
    },
    {
      "code": 6019,
      "name": "cpiDataMissing",
      "msg": "CPI data is required but not provided"
    },
    {
      "code": 6020,
      "name": "insufficientCpiAccounts",
      "msg": "Insufficient remaining accounts for CPI instruction"
    },
    {
      "code": 6021,
      "name": "accountSliceOutOfBounds",
      "msg": "Account slice index out of bounds"
    },
    {
      "code": 6022,
      "name": "solTransferInsufficientAccounts",
      "msg": "SOL transfer requires at least 2 remaining accounts"
    },
    {
      "code": 6023,
      "name": "cpiDataInvalid",
      "msg": "CPI data provided is invalid"
    },
    {
      "code": 6024,
      "name": "newAuthenticatorMissing",
      "msg": "New authenticator account is required but not provided"
    },
    {
      "code": 6025,
      "name": "newAuthenticatorPasskeyMissing",
      "msg": "New authenticator passkey is required but not provided"
    },
    {
      "code": 6026,
      "name": "insufficientLamports",
      "msg": "Insufficient lamports for requested transfer"
    },
    {
      "code": 6027,
      "name": "transferAmountOverflow",
      "msg": "Transfer amount would cause arithmetic overflow"
    },
    {
      "code": 6028,
      "name": "invalidBumpSeed",
      "msg": "Invalid bump seed for PDA derivation"
    },
    {
      "code": 6029,
      "name": "invalidAccountOwner",
      "msg": "Account owner verification failed"
    },
    {
      "code": 6030,
      "name": "invalidAccountDiscriminator",
      "msg": "Account discriminator mismatch"
    }
  ],
  "types": [
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "createSmartWalletFee",
            "type": "u64"
          },
          {
            "name": "executeInstructionFee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "executeInstructionArgs",
      "docs": [
        "Arguments for the execute_instruction entrypoint"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "passkeyPubkey",
            "type": {
              "array": [
                "u8",
                33
              ]
            }
          },
          {
            "name": "signature",
            "type": "bytes"
          },
          {
            "name": "clientDataJsonRaw",
            "type": "bytes"
          },
          {
            "name": "authenticatorDataRaw",
            "type": "bytes"
          },
          {
            "name": "verifyInstructionIndex",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "smartWalletAuthenticator",
      "docs": [
        "Account that stores authentication data for a smart wallet"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "passkeyPubkey",
            "docs": [
              "The public key of the passkey that can authorize transactions"
            ],
            "type": {
              "array": [
                "u8",
                33
              ]
            }
          },
          {
            "name": "smartWallet",
            "docs": [
              "The smart wallet this authenticator belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "credentialId",
            "docs": [
              "The credential ID this authenticator belongs to"
            ],
            "type": "bytes"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA derivation"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "smartWalletConfig",
      "docs": [
        "Data account for a smart wallet"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "docs": [
              "Unique identifier for this smart wallet"
            ],
            "type": "u64"
          },
          {
            "name": "lastNonce",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "smartWalletSeq",
      "docs": [
        "Account that maintains the sequence number for smart wallet creation"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seq",
            "docs": [
              "Current sequence number, incremented for each new smart wallet"
            ],
            "type": "u64"
          }
        ]
      }
    }
  ]
};
