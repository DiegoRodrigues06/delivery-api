import fs from 'fs/promises'; // biblioteca para ler e escrever arquivos.
import path from 'path'; // biblioteca para lidar com caminhos de arquivos.
import { fileURLToPath } from 'url'; // função para converter URL de módulo para caminho de arquivo.

// pega a url do arquivo atual e converte em caminho de sistema
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // pega só o diretorio do arquivo atual.

class OrderRepository {

  constructor() {
    this.filePath = path.resolve(__dirname, '../../pedidos.json');
  }

  async readAll() { // Lê o arquivo JSON e retorna um array de pedidos.
    const data = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(data);
  }

  async saveAll(orders) { // sobresvre o arquivo com um novo array.
    await fs.writeFile(
      this.filePath,
      JSON.stringify(orders, null, 2)
    );
  }

  async findById(orderId) { 
    const orders = await this.readAll();
    return orders.find(order => order.order_id === orderId);
    // Lê o arquivo e retorna o pedido com o ID correspondente, ou undefined se não encontrado.
  }

  async deleteById(orderId) {
    const orders = await this.readAll();
    const filtered = orders.filter(order => order.order_id !== orderId);
    await this.saveAll(filtered);
    return filtered.length !== orders.length;
    // Lê o arquivo e remove o pedido com o ID correspondente, salvando o novo array.
  }

}

export default new OrderRepository();
