const config = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
      '^react-tivity$': '<rootDir>/src/index.ts'
    },
    transform: {
        "\\.[jt]sx?$": "babel-jest"
      },
    setupFilesAfterEnv: ['<rootDir>/scripts/jest-setup.js']
}

module.exports = config