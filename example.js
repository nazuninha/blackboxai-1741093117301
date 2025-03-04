// Exemplo de como usar a classe RPG
const RPG = require('./rpg.js');

async function example() {
    // Criar uma instância para um usuário
    const rpg = new RPG("123456");
    
    // Inicializar diretórios necessários
    await rpg.initializeDirs();
    
    // Mostrar status inicial
    console.log(await rpg.getStatus());
    
    // Exemplo de operações bancárias
    console.log(await rpg.deposit(100)); // Depositar 100
    console.log(await rpg.balance());     // Verificar saldo
    console.log(await rpg.withdraw(50));  // Sacar 50
    console.log(await rpg.balance());     // Verificar saldo
    console.log(await rpg.transfer("654321", 30)); // Transferir 30 para outro usuário
    console.log(await rpg.balance());     // Verificar saldo após transferência
    
    // Mostrar status final após operações
    console.log(await rpg.getStatus());
}

example().catch(console.error);