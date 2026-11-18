const assert = require('node:assert/strict')
const { test } = require('node:test')
const { getEmailError, getPasswordError, getPasswordRequirements } = require('../lib/user-validation.ts')

test('email is required, including whitespace-only values', () => {
  for (const email of ['', ' ', '\t']) {
    assert.equal(getEmailError(email), 'usersEmailRequired')
  }
})

test('accepts standard addresses, aliases, subdomains and domain hyphens', () => {
  for (const email of ['user@example.com', 'first.last+school@example.co.uk', 'USER@EXAMPLE.COM', 'user@school-name.example', "o'connor@example.com"]) {
    assert.equal(getEmailError(email), null, email)
  }
})

test('rejects malformed addresses before sending them to the server', () => {
  for (const email of [
    'user', 'user@', '@example.com', 'user@example', 'user@@example.com',
    'user name@example.com', 'user@example .com', 'user@example..com',
    '.user@example.com', 'user.@example.com', 'first..last@example.com',
    'user@-example.com', 'user@example-.com', 'user@exam_ple.com',
    'user@.example.com', 'user@example.com.', 'user<>@example.com',
    'user@example.com\n', `${'a'.repeat(65)}@example.com`,
    `user@${'a'.repeat(64)}.com`,
    `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.com`,
  ]) {
    assert.equal(getEmailError(email), 'usersEmailInvalid', JSON.stringify(email))
  }
})

test('accepts the email local-part and domain-label length boundaries', () => {
  assert.equal(getEmailError(`${'a'.repeat(64)}@example.com`), null)
  assert.equal(getEmailError(`user@${'a'.repeat(63)}.com`), null)
})

test('requires a nonblank password of at least eight characters', () => {
  for (const password of ['', '        ']) {
    assert.equal(getPasswordError(password), 'usersPasswordRequired')
  }
  assert.equal(getPasswordError('123456!'), 'usersPasswordTooShort')
  assert.equal(getPasswordError('1234567!'), null)
})

test('accepts every special character required by the backend', () => {
  for (const symbol of '()*!@#') {
    assert.equal(getPasswordError(`1234567${symbol}`), null)
  }
})

test('rejects passwords without one of the backend special characters', () => {
  for (const password of ['12345678', 'Password', 'Password$', 'Password%', 'Password_']) {
    assert.equal(getPasswordError(password), 'usersPasswordSpecialChar')
  }
})

test('password hints track length and special characters independently', () => {
  assert.deepEqual(getPasswordRequirements(''), { minLength: false, specialCharacter: false })
  assert.deepEqual(getPasswordRequirements('!'), { minLength: false, specialCharacter: true })
  assert.deepEqual(getPasswordRequirements('12345678'), { minLength: true, specialCharacter: false })
  assert.deepEqual(getPasswordRequirements('1234567!'), { minLength: true, specialCharacter: true })
})
