import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './'
})

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
    // Setup file to run before each test
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

    // Use node environment for API route tests (has native fetch/Response in Node 18+)
    testEnvironment: 'node',
    
    // Enable experimental VM modules for ESM support
    testEnvironmentOptions: {
        customExportConditions: ['node', 'node-addons'],
    },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)