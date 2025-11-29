// tests/unit/calculoPacote.test.js
import { describe, it, expect, jest } from '@jest/globals';

// Vamos simular o serviço para testar a lógica matemática isolada
// Imagine que essa lógica está dentro do seu pacoteService
const calcularValorPacote = (peso, valorPorKg) => {
    if (peso <= 0) throw new Error("Peso inválido");
    return peso * valorPorKg;
};

describe('Lógica de Negócio: Cálculo de Valor', () => {
    
    it('Deve calcular corretamente o valor do pacote (Peso * Valor Material)', () => {
        const peso = 10; // kg
        const valorMaterial = 0.50; // por kg (Plástico)
        
        const resultado = calcularValorPacote(peso, valorMaterial);
        
        expect(resultado).toBe(5.00);
    });

    it('Deve lançar erro se o peso for negativo ou zero', () => {
        expect(() => calcularValorPacote(-5, 10)).toThrow("Peso inválido");
        expect(() => calcularValorPacote(0, 10)).toThrow("Peso inválido");
    });

    it('Deve calcular a taxa de serviço corretamente (25%)', () => {
        const valorPacote = 100.00;
        const taxaServico = valorPacote * 0.25;

        expect(taxaServico).toBe(25.00);
    });
});