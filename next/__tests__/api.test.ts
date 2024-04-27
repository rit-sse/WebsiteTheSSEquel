const request = require('supertest');
const api = require("../app");

describe('Mentor API Test', () => {
    it('Get Mentor', async () => {
        const response = await request(api).get('http://localhost:3000/api/mentor/');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: expect.any(Number),
                isActive: expect.any(Boolean),
                expirationDate: expect.any(String),
                user: expect.objectContaining({
                    id: expect.any(Number),
                    firstName: expect.any(String),
                    lastName: expect.any(String),
                    email: expect.any(String),
                }),
            }),
        ]));
    });
});