import request from 'supertest';
import app from '../../src/app.js'; // Importa seu Express App
import { prisma } from '../../src/config/database.js';

// Antes de tudo, vamos limpar o usuário de teste caso ele já exista
// para não dar erro de "Email já cadastrado"
const usuarioTeste = {
    nome_completo: "Tester Jest",
    email: "jest@teste.com",
    senha: "123",
    tipo_documento: "CPF",
    documento: "99999999999"
};

describe('Integração: Autenticação', () => {

    // Antes de rodar os testes, limpa o banco (apenas o usuario de teste)
    beforeAll(async () => {
        await prisma.usuario.deleteMany({
            where: { email: usuarioTeste.email }
        });
    });

    // Depois de rodar tudo, limpa de novo e fecha conexão
    afterAll(async () => {
        await prisma.usuario.deleteMany({
            where: { email: usuarioTeste.email }
        });
        await prisma.$disconnect();
    });

    it('Deve registrar um novo usuário com sucesso', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send(usuarioTeste);

        // Espera status 201 (Criado)
        expect(response.status).toBe(201);
        
        // Espera que retorne o ID e o Email
        expect(response.body).toHaveProperty('id');
        expect(response.body.email).toBe(usuarioTeste.email);
    });

    it('Não deve permitir registrar o mesmo email duas vezes', async () => {
        // Tenta registrar de novo o mesmo usuário
        const response = await request(app)
            .post('/auth/register')
            .send(usuarioTeste);

        // Espera status 409 (Conflict) - Configurado no seu errorMiddleware
        expect(response.status).toBe(409);
    });

    it('Deve fazer login e retornar um Token JWT', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: usuarioTeste.email,
                senha: usuarioTeste.senha
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body.user.email).toBe(usuarioTeste.email);
    });

    it('Não deve logar com senha errada', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: usuarioTeste.email,
                senha: "senha_errada"
            });

        expect(response.status).toBe(401);
    });
});