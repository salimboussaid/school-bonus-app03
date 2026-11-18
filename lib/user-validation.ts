export const PASSWORD_MIN_LENGTH = 8

export function getPasswordRequirements(password: string) {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    specialCharacter: /[()*!@#]/.test(password),
  }
}

export function getPasswordError(password: string) {
  if (!password.trim()) return 'usersPasswordRequired'

  const requirements = getPasswordRequirements(password)
  if (!requirements.minLength) return 'usersPasswordTooShort'
  if (!requirements.specialCharacter) return 'usersPasswordSpecialChar'

  return null
}

export function getEmailError(email: string) {
  if (!email.trim()) return 'usersEmailRequired'
  if (email.length > 254) return 'usersEmailInvalid'

  const parts = email.split('@')
  if (parts.length !== 2) return 'usersEmailInvalid'

  const [local, domain] = parts
  if (
    !local || local.length > 64 ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local) ||
    local.startsWith('.') || local.endsWith('.') || local.includes('..')
  ) return 'usersEmailInvalid'

  const labels = domain.split('.')
  if (
    labels.length < 2 ||
    labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))
  ) return 'usersEmailInvalid'

  return null
}
