// Exemplo de como usar a classe RPG
const RPG = require('./rpg.js');

async function example() {
    // Criar uma instância para um usuário
    const rpg = new RPG("123456");
    
    // Inicializar diretórios necessários
    await rpg.initializeDirs();
    
    // Mostrar status inicial
    console.log(await rpg.getStatus());
    
    // Listar empregos disponíveis
    console.log(await rpg.listJobs());
    
    // Aplicar para um emprego
    console.log(await rpg.applyForJob('Vendedor')); // Aplicar para Vendedor
    
    // Trabalhar no emprego atual
    console.log(await rpg.work()); // Trabalhar
    
    // Mostrar status após trabalho
    console.log(await rpg.getStatus());
    
    // Demitir-se do emprego
    console.log(await rpg.quitJob());
    
    // Mostrar status final
    console.log(await rpg.getStatus());
}

example().catch(console.error);