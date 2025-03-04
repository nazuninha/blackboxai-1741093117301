const fs = require('fs').promises;
const path = require('path');

class RPG {
    constructor(userId) {
        this.userId = userId;
        this.dbPath = path.join(__dirname, 'db');
        this.usersPath = path.join(this.dbPath, 'users');
        this.ganguesPath = path.join(this.dbPath, 'gangues');
    }

    // Formata mensagens de retorno
    formatMessage(title, message) {
        return `━━━━━━━━『 ${title} 』━━━━━━━━\n${message}\n━━━━━━━━━━━━━━━━━━━━━━`;
    }

    // Formata valores monetários
    formatMoney(amount) {
        return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Verifica/cria diretórios necessários
    async initializeDirs() {
        const dirs = [this.dbPath, this.usersPath, this.ganguesPath];
        for (const dir of dirs) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
            }
        }
    }

    // Carrega dados do usuário
    async loadUserData() {
        const userFile = path.join(this.usersPath, `${this.userId}.json`);
        try {
            const data = await fs.readFile(userFile, 'utf8');
            return JSON.parse(data);
        } catch {
            // Se não existir, cria um novo usuário com dados padrão
            const defaultData = {
                id: this.userId,
                level: 1,
                xp: 0,
                money: 0,
                bank: 0,
                energy: 100,
                maxEnergy: 100,
                lastTraining: null,
                inventory: [],
                stats: {
                    hp: 100,
                    maxHp: 100,
                    strength: 10,
                    defense: 10,
                    agility: 10,
                    stamina: 10,
                    vitality: 10
                },
                training: {
                    strengthXp: 0,
                    defenseXp: 0,
                    agilityXp: 0,
                    staminaXp: 0,
                    vitalityXp: 0
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await this.saveUserData(defaultData);
            return defaultData;
        }
    }

    // Salva dados do usuário
    async saveUserData(data) {
        const userFile = path.join(this.usersPath, `${this.userId}.json`);
        data.updatedAt = new Date().toISOString();
        await fs.writeFile(userFile, JSON.stringify(data, null, 2));
        return data;
    }

    // Sistema Bancário

    // Verifica saldo da carteira e banco
    async balance() {
        const userData = await this.loadUserData();
        const message = [
            `💰 Carteira: ${this.formatMoney(userData.money)}`,
            `🏦 Banco: ${this.formatMoney(userData.bank)}`,
            `💎 Total: ${this.formatMoney(userData.money + userData.bank)}`
        ].join('\n');

        return this.formatMessage('Saldo', message);
    }

    // Deposita dinheiro no banco
    async deposit(amount) {
        const userData = await this.loadUserData();

        // Verifica se amount é "all" para depositar tudo
        if (amount === 'all') {
            amount = userData.money;
        } else {
            amount = parseInt(amount);
        }

        // Validações
        if (isNaN(amount) || amount <= 0) {
            return this.formatMessage('Banco', '❌ Valor inválido para depósito!');
        }

        if (amount > userData.money) {
            return this.formatMessage('Banco', '❌ Você não tem dinheiro suficiente na carteira!');
        }

        // Realiza o depósito
        userData.money -= amount;
        userData.bank += amount;
        await this.saveUserData(userData);

        return this.formatMessage('Banco', 
            `✅ Depósito realizado com sucesso!\n` +
            `💰 Carteira: ${this.formatMoney(userData.money)}\n` +
            `🏦 Banco: ${this.formatMoney(userData.bank)}`
        );
    }

    // Saca dinheiro do banco
    async withdraw(amount) {
        const userData = await this.loadUserData();

        // Verifica se amount é "all" para sacar tudo
        if (amount === 'all') {
            amount = userData.bank;
        } else {
            amount = parseInt(amount);
        }

        // Validações
        if (isNaN(amount) || amount <= 0) {
            return this.formatMessage('Banco', '❌ Valor inválido para saque!');
        }

        if (amount > userData.bank) {
            return this.formatMessage('Banco', '❌ Você não tem dinheiro suficiente no banco!');
        }

        // Realiza o saque
        userData.bank -= amount;
        userData.money += amount;
        await this.saveUserData(userData);

        return this.formatMessage('Banco', 
            `✅ Saque realizado com sucesso!\n` +
            `💰 Carteira: ${this.formatMoney(userData.money)}\n` +
            `🏦 Banco: ${this.formatMoney(userData.bank)}`
        );
    }

    // Transfere dinheiro para outro usuário
    async transfer(targetId, amount) {
        if (targetId === this.userId) {
            return this.formatMessage('Transferência', '❌ Você não pode transferir dinheiro para si mesmo!');
        }

        const userData = await this.loadUserData();
        amount = parseInt(amount);

        // Validações
        if (isNaN(amount) || amount <= 0) {
            return this.formatMessage('Transferência', '❌ Valor inválido para transferência!');
        }

        if (amount > userData.bank) {
            return this.formatMessage('Transferência', '❌ Você não tem dinheiro suficiente no banco!');
        }

        // Carrega dados do usuário alvo
        const targetFile = path.join(this.usersPath, `${targetId}.json`);
        let targetData;
        try {
            const data = await fs.readFile(targetFile, 'utf8');
            targetData = JSON.parse(data);
        } catch {
            return this.formatMessage('Transferência', '❌ Usuário alvo não encontrado!');
        }

        // Realiza a transferência
        userData.bank -= amount;
        targetData.bank += amount;

        // Salva as alterações
        await this.saveUserData(userData);
        await fs.writeFile(targetFile, JSON.stringify(targetData, null, 2));

        return this.formatMessage('Transferência', 
            `✅ Transferência realizada com sucesso!\n` +
            `👤 Para: ${targetId}\n` +
            `💸 Valor: ${this.formatMoney(amount)}\n` +
            `🏦 Seu saldo no banco: ${this.formatMoney(userData.bank)}`
        );
    }

    // Obtém status do usuário
    async getStatus() {
        const userData = await this.loadUserData();
        const { level, xp, money, bank, energy, maxEnergy, stats, training } = userData;
        
        const message = [
            `📊 Level: ${level}`,
            `✨ XP: ${xp}`,
            `💰 Carteira: ${this.formatMoney(money)}`,
            `🏦 Banco: ${this.formatMoney(bank)}`,
            `⚡ Energia: ${energy}/${maxEnergy}`,
            `\n📈 Status:`,
            `❤️ HP: ${stats.hp}/${stats.maxHp}`,
            `💪 Força: ${stats.strength} (XP: ${training.strengthXp})`,
            `🛡️ Defesa: ${stats.defense} (XP: ${training.defenseXp})`,
            `⚡ Agilidade: ${stats.agility} (XP: ${training.agilityXp})`,
            `🏃 Stamina: ${stats.stamina} (XP: ${training.staminaXp})`,
            `❤️ Vitalidade: ${stats.vitality} (XP: ${training.vitalityXp})`
        ].join('\n');

        return this.formatMessage('Status', message);
    }

    // Sistema de treino
    async train(type) {
        const userData = await this.loadUserData();
        const now = new Date();
        
        // Verifica se tem energia suficiente
        if (userData.energy < 10) {
            return this.formatMessage('Treino', '❌ Você está sem energia para treinar! Descanse um pouco.');
        }

        // Verifica cooldown de treino (5 minutos)
        if (userData.lastTraining) {
            const lastTraining = new Date(userData.lastTraining);
            const diffMinutes = (now - lastTraining) / 1000 / 60;
            if (diffMinutes < 5) {
                const remainingMinutes = Math.ceil(5 - diffMinutes);
                return this.formatMessage('Treino', `❌ Aguarde ${remainingMinutes} minutos para treinar novamente!`);
            }
        }

        // Define ganhos base de XP e custo de energia
        const baseXpGain = Math.floor(Math.random() * 5) + 5; // 5-10 XP por treino
        const energyCost = 10;

        // Aplica o treino baseado no tipo
        let message = '';
        switch (type.toLowerCase()) {
            case 'força':
            case 'forca':
                userData.training.strengthXp += baseXpGain;
                if (userData.training.strengthXp >= 100) {
                    userData.stats.strength += 1;
                    userData.training.strengthXp -= 100;
                    message = `💪 Força aumentou para ${userData.stats.strength}!`;
                } else {
                    message = `💪 Ganhou ${baseXpGain} XP de força! (${userData.training.strengthXp}/100)`;
                }
                break;

            case 'defesa':
                userData.training.defenseXp += baseXpGain;
                if (userData.training.defenseXp >= 100) {
                    userData.stats.defense += 1;
                    userData.training.defenseXp -= 100;
                    message = `🛡️ Defesa aumentou para ${userData.stats.defense}!`;
                } else {
                    message = `🛡️ Ganhou ${baseXpGain} XP de defesa! (${userData.training.defenseXp}/100)`;
                }
                break;

            case 'agilidade':
                userData.training.agilityXp += baseXpGain;
                if (userData.training.agilityXp >= 100) {
                    userData.stats.agility += 1;
                    userData.training.agilityXp -= 100;
                    message = `⚡ Agilidade aumentou para ${userData.stats.agility}!`;
                } else {
                    message = `⚡ Ganhou ${baseXpGain} XP de agilidade! (${userData.training.agilityXp}/100)`;
                }
                break;

            case 'stamina':
                userData.training.staminaXp += baseXpGain;
                if (userData.training.staminaXp >= 100) {
                    userData.stats.stamina += 1;
                    userData.training.staminaXp -= 100;
                    message = `🏃 Stamina aumentou para ${userData.stats.stamina}!`;
                } else {
                    message = `🏃 Ganhou ${baseXpGain} XP de stamina! (${userData.training.staminaXp}/100)`;
                }
                break;

            case 'vitalidade':
                userData.training.vitalityXp += baseXpGain;
                if (userData.training.vitalityXp >= 100) {
                    userData.stats.vitality += 1;
                    userData.training.vitalityXp -= 100;
                    // Aumenta HP máximo ao subir vitalidade
                    userData.stats.maxHp += 10;
                    userData.stats.hp = userData.stats.maxHp; // Cura totalmente ao aumentar vitalidade
                    message = `❤️ Vitalidade aumentou para ${userData.stats.vitality}!\nHP Máximo aumentou para ${userData.stats.maxHp}!`;
                } else {
                    message = `❤️ Ganhou ${baseXpGain} XP de vitalidade! (${userData.training.vitalityXp}/100)`;
                }
                break;

            default:
                return this.formatMessage('Treino', '❌ Tipo de treino inválido! Escolha: força, defesa, agilidade, stamina ou vitalidade');
        }

        // Atualiza energia e último treino
        userData.energy -= energyCost;
        userData.lastTraining = now.toISOString();
        
        // Salva os dados atualizados
        await this.saveUserData(userData);

        return this.formatMessage('Treino', 
            `${message}\n` +
            `⚡ Energia restante: ${userData.energy}/${userData.maxEnergy}`
        );
    }

    // Sistema de descanso para recuperar energia
    async rest() {
        const userData = await this.loadUserData();
        
        if (userData.energy >= userData.maxEnergy) {
            return this.formatMessage('Descanso', '❌ Sua energia já está no máximo!');
        }

        // Recupera 20 de energia
        const recoveryAmount = 20;
        userData.energy = Math.min(userData.maxEnergy, userData.energy + recoveryAmount);
        
        await this.saveUserData(userData);

        return this.formatMessage('Descanso', 
            `😴 Você descansou e recuperou ${recoveryAmount} de energia!\n` +
            `⚡ Energia atual: ${userData.energy}/${userData.maxEnergy}`
        );
    }
}

module.exports = RPG;