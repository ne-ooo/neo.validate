import {
  createEmailValidator,
  createURLValidator,
  isEmail,
  isUUID,
  type EmailOptions,
  type UUIDVersion,
} from '@lpm.dev/neo.validate'

const options: EmailOptions = { requireTld: true }
const result: boolean = isEmail('user@example.com', options)
const uuidVersion: UUIDVersion = 7
const uuidResult: boolean = isUUID('019535d9-3df7-7a28-8a7f-9f4bc7c8e101', uuidVersion)
const validateEmail: (value: string) => boolean = createEmailValidator(options)
const validateURL: (value: string) => boolean = createURLValidator({ protocols: ['https'] })

void [result, uuidResult, validateEmail, validateURL]
