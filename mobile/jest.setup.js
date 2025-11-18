// Jest setup file
jest.mock('@celo/minipay-sdk', () => ({
  MiniPay: jest.fn(),
}));

jest.mock('@celo/socialconnect', () => ({
  SocialConnect: jest.fn(),
}));

