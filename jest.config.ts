// from https://basarat.gitbook.io/typescript/intro-1/jest
export default {
    "roots": [
      "<rootDir>/test"
    ],
    "testMatch": [
      "**/__tests__/**/*.+(ts|tsx|js)",
      "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    "transform": {
      "^.+\\.(ts|tsx)$": "ts-jest"
    }
  }