// from https://basarat.gitbook.io/typescript/intro-1/jest
export default {
    "roots": [
      "<rootDir>/test"
    ],
    "testMatch": [
      "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    "transform": {
      "^.+\\.(ts|tsx)$": "ts-jest"
    }
  }