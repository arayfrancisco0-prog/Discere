const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('./db');
const { createSchema } = require('./schema');

async function seed() {
  const db = await getDb();
  await createSchema(db);

  const existing = db.exec("SELECT COUNT(*) as c FROM users");
  if (existing.length > 0 && existing[0].values[0][0] > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding database...');

  const hash = (pwd) => bcrypt.hashSync(pwd, 10);

  // Users
  const adminId = uuidv4();
  const teacherId = uuidv4();
  const teacher2Id = uuidv4();
  const studentId = uuidv4();

  db.run(`INSERT INTO users (id, name, email, password, role) VALUES (?,?,?,?,?)`,
    [adminId, 'Administrador', 'arayfrancisco0@gmail.com', hash('2011'), 'ADMIN']);
  db.run(`INSERT INTO users (id, name, email, password, role, bio) VALUES (?,?,?,?,?,?)`,
    [teacherId, 'Professor Carlos', 'professor@discere.com', hash('123456'), 'TEACHER', 'Professor de programação há 10 anos']);
  db.run(`INSERT INTO users (id, name, email, password, role, bio) VALUES (?,?,?,?,?,?)`,
    [teacher2Id, 'Maria Silva', 'maria@discere.com', hash('123456'), 'TEACHER', 'Especialista em desenvolvimento web']);
  db.run(`INSERT INTO users (id, name, email, password, role) VALUES (?,?,?,?,?)`,
    [studentId, 'Aluno Teste', 'aluno@discere.com', hash('123456'), 'STUDENT']);

  db.run(`INSERT INTO student_profiles (id, user_id, total_points) VALUES (?,?,?)`, [uuidv4(), studentId, 0]);
  db.run(`INSERT INTO teachers (id, user_id, specialty, bio) VALUES (?,?,?,?)`, [uuidv4(), teacherId, 'Python, Java, JavaScript', 'Professor de programação há 10 anos']);
  db.run(`INSERT INTO teachers (id, user_id, specialty, bio) VALUES (?,?,?,?)`, [uuidv4(), teacher2Id, 'HTML, CSS, JavaScript', 'Especialista em desenvolvimento web']);

  // Categories
  const cats = [
    ['Python', 'python'], ['Java', 'java'], ['JavaScript', 'javascript'],
    ['TypeScript', 'typescript'], ['HTML', 'html'], ['CSS', 'css'],
    ['React', 'react'], ['Node.js', 'nodejs'], ['PHP', 'php'],
    ['C#', 'csharp'], ['C++', 'cpp'], ['Database', 'database'],
    ['Web Dev', 'web-dev'], ['Mobile Dev', 'mobile-dev'],
    ['AI', 'ai'], ['Data Science', 'data-science']
  ];
  const catIds = {};
  for (const [name, slug] of cats) {
    const id = uuidv4();
    catIds[slug] = id;
    db.run(`INSERT INTO categories (id, name, slug) VALUES (?,?,?)`, [id, name, slug]);
  }

  // Courses
  // Course 1: Python
  const pyId = uuidv4();
  db.run(`INSERT INTO courses (id, title, slug, description, short_description, level, published, category_id, teacher_id) VALUES (?,?,?,?,?,?,?,?,?)`,
    [pyId, 'Python Completo: do Básico ao Avançado', 'python-completo',
    'Aprenda Python do zero ao avançado com exercícios práticos e projetos reais. Este curso cobre desde fundamentos até tópicos avançados como orientação a objetos, manipulação de arquivos e bibliotecas populares.',
    'Domine Python com exercícios práticos', 'BEGINNER', 1, catIds['python'], teacherId]);

  const pyModules = [
    { title: 'Introdução ao Python', lessons: [
      { title: 'O que é Python?', content: '<p>Python é uma linguagem de programação de alto nível, interpretada e de propósito geral. Criada por Guido van Rossum em 1991, é conhecida por sua sintaxe clara e legibilidade.</p>', duration: 15 },
      { title: 'Instalação e Configuração', content: '<p>Para instalar Python, acesse python.org e baixe a versão mais recente. Recomendamos usar o VS Code como editor.</p>', duration: 20 },
      { title: 'Primeiro Programa', content: '<p>Vamos escrever nosso primeiro programa: print("Olá, Mundo!")</p>', duration: 10, exercises: [
        { title: 'Olá Mundo', instructions: 'Escreva um programa que imprima "Olá, Mundo!" na tela.', starterCode: 'print()', solutionCode: 'print("Olá, Mundo!")', language: 'python', points: 5 }
      ]}
    ]},
    { title: 'Variáveis e Tipos de Dados', lessons: [
      { title: 'Variáveis em Python', content: '<p>Variáveis são usadas para armazenar dados. Em Python, não é necessário declarar o tipo.</p>', duration: 15 },
      { title: 'Tipos Numéricos', content: '<p>Python suporta inteiros (int), ponto flutuante (float) e números complexos.</p>', duration: 15 },
      { title: 'Strings', content: '<p>Strings são sequências de caracteres. Podem ser definidas com aspas simples ou duplas.</p>', duration: 15, exercises: [
        { title: 'Manipulação de Strings', instructions: 'Crie uma variável nome com seu nome e imprima "Olá, [nome]!"', starterCode: 'nome = ""\nprint()', solutionCode: 'nome = "Maria"\nprint(f"Olá, {nome}!")', language: 'python', points: 10 }
      ]}
    ]},
    { title: 'Estruturas de Controle', lessons: [
      { title: 'Condicionais if/else', content: '<p>Estruturas condicionais permitem executar código baseado em condições.</p>', duration: 20, exercises: [
        { title: 'Par ou Ímpar', instructions: 'Escreva um programa que verifique se um número é par ou ímpar.', starterCode: 'numero = int(input())\nif ', solutionCode: 'numero = int(input())\nif numero % 2 == 0:\n    print("Par")\nelse:\n    print("Ímpar")', language: 'python', points: 10 }
      ]},
      { title: 'Loops for e while', content: '<p>Loops permitem executar um bloco de código repetidamente.</p>', duration: 20 }
    ]},
    { title: 'Funções', lessons: [
      { title: 'Definindo Funções', content: '<p>Funções são blocos de código reutilizáveis. Use a palavra-chave def.</p>', duration: 20, exercises: [
        { title: 'Calculadora Simples', instructions: 'Crie uma função que receba dois números e retorne a soma.', starterCode: 'def somar(a, b):\n    ', solutionCode: 'def somar(a, b):\n    return a + b', language: 'python', points: 10 }
      ]}
    ]},
    { title: 'Listas e Dicionários', lessons: [
      { title: 'Listas em Python', content: '<p>Listas são coleções ordenadas e mutáveis.</p>', duration: 15 },
      { title: 'Dicionários', content: '<p>Dicionários armazenam pares chave-valor.</p>', duration: 15 }
    ]},
    { title: 'Programação Orientada a Objetos', lessons: [
      { title: 'Classes e Objetos', content: '<p>POO é um paradigma que organiza código em classes e objetos.</p>', duration: 25 },
      { title: 'Herança e Polimorfismo', content: '<p>Herança permite que uma classe herde atributos de outra.</p>', duration: 25 },
      { title: 'Projeto Final', content: '<p>Crie um sistema de biblioteca usando POO.</p>', duration: 30, exercises: [
        { title: 'Sistema de Biblioteca', instructions: 'Crie uma classe Livro com título, autor e ano. Depois crie uma classe Biblioteca que gerencie os livros.', starterCode: 'class Livro:\n    ', solutionCode: 'class Livro:\n    def __init__(self, titulo, autor, ano):\n        self.titulo = titulo\n        self.autor = autor\n        self.ano = ano\n\nclass Biblioteca:\n    def __init__(self):\n        self.livros = []\n    \n    def adicionar(self, livro):\n        self.livros.append(livro)', language: 'python', points: 20 }
      ]}
    ]}
  ];

  let order = 0;
  for (const mod of pyModules) {
    order++;
    const modId = uuidv4();
    db.run(`INSERT INTO modules (id, course_id, title, order_num) VALUES (?,?,?,?)`, [modId, pyId, mod.title, order]);
    let lessOrder = 0;
    for (const les of mod.lessons) {
      lessOrder++;
      const lesId = uuidv4();
      db.run(`INSERT INTO lessons (id, module_id, title, content, duration, order_num) VALUES (?,?,?,?,?,?)`,
        [lesId, modId, les.title, les.content, les.duration, lessOrder]);
      if (les.exercises) {
        let exOrder = 0;
        for (const ex of les.exercises) {
          exOrder++;
          db.run(`INSERT INTO exercises (id, lesson_id, title, instructions, starter_code, solution_code, language, points, order_num) VALUES (?,?,?,?,?,?,?,?,?)`,
            [uuidv4(), lesId, ex.title, ex.instructions, ex.starterCode, ex.solutionCode, ex.language, ex.points, exOrder]);
        }
      }
    }
  }

  // Course 2: Java
  const javaId = uuidv4();
  db.run(`INSERT INTO courses (id, title, slug, description, short_description, level, published, category_id, teacher_id) VALUES (?,?,?,?,?,?,?,?,?)`,
    [javaId, 'Java: Orientação a Objetos', 'java-oo',
    'Aprenda Java e os fundamentos da programação orientada a objetos. Este curso cobre desde a sintaxe básica até conceitos avançados de POO.',
    'Domine Java e POO', 'INTERMEDIATE', 1, catIds['java'], teacherId]);

  const javaModules = [
    { title: 'Fundamentos do Java', lessons: [
      { title: 'Introdução ao Java', content: '<p>Java é uma linguagem multiplataforma orientada a objetos criada pela Sun Microsystems.</p>', duration: 15 },
      { title: 'Sintaxe Básica', content: '<p>Conheça a estrutura de um programa Java.</p>', duration: 20 }
    ]},
    { title: 'Orientação a Objetos', lessons: [
      { title: 'Classes e Objetos', content: '<p>Em Java, tudo é objeto. A classe é o molde para criar objetos.</p>', duration: 25, exercises: [
        { title: 'Classe Pessoa', instructions: 'Crie uma classe Pessoa com atributos nome e idade, e um método falar().', starterCode: 'public class Pessoa {\n    ', solutionCode: 'public class Pessoa {\n    String nome;\n    int idade;\n    \n    public void falar() {\n        System.out.println("Olá, meu nome é " + nome);\n    }\n}', language: 'java', points: 15 }
      ]},
      { title: 'Encapsulamento', content: '<p>Encapsulamento protege os dados da classe.</p>', duration: 20 },
      { title: 'Herança', content: '<p>Herança permite reutilizar código entre classes.</p>', duration: 20 },
      { title: 'Polimorfismo', content: '<p>Polimorfismo permite que objetos assumam múltiplas formas.</p>', duration: 20 },
      { title: 'Interfaces', content: '<p>Interfaces definem contratos que as classes devem implementar.</p>', duration: 20 }
    ]},
    { title: 'Coleções e Exceções', lessons: [
      { title: 'ArrayList e HashMap', content: '<p>Coleções são estruturas de dados poderosas em Java.</p>', duration: 20 },
      { title: 'Tratamento de Exceções', content: '<p>Exceções permitem lidar com erros de forma elegante.</p>', duration: 20, exercises: [
        { title: 'Divisão Segura', instructions: 'Crie um método que divida dois números e trate a exceção de divisão por zero.', starterCode: 'public class Calculadora {\n    ', solutionCode: 'public class Calculadora {\n    public static double dividir(int a, int b) {\n        try {\n            return a / b;\n        } catch (ArithmeticException e) {\n            System.out.println("Erro: divisão por zero");\n            return 0;\n        }\n    }\n}', language: 'java', points: 15 }
      ]}
    ]},
    { title: 'Projeto Final', lessons: [
      { title: 'Sistema Bancário', content: '<p>Construa um sistema bancário simples com contas, saques e depósitos.</p>', duration: 30, exercises: [
        { title: 'Sistema Bancário', instructions: 'Crie classes Conta, ContaCorrente e ContaPoupanca com métodos sacar e depositar.', starterCode: 'class Conta {\n    ', solutionCode: 'class Conta {\n    protected double saldo;\n    \n    public void depositar(double valor) {\n        saldo += valor;\n    }\n    \n    public void sacar(double valor) {\n        if (saldo >= valor) saldo -= valor;\n    }\n}', language: 'java', points: 20 }
      ]}
    ]}
  ];

  order = 0;
  for (const mod of javaModules) {
    order++;
    const modId = uuidv4();
    db.run(`INSERT INTO modules (id, course_id, title, order_num) VALUES (?,?,?,?)`, [modId, javaId, mod.title, order]);
    let lessOrder = 0;
    for (const les of mod.lessons) {
      lessOrder++;
      const lesId = uuidv4();
      db.run(`INSERT INTO lessons (id, module_id, title, content, duration, order_num) VALUES (?,?,?,?,?,?)`,
        [lesId, modId, les.title, les.content, les.duration, lessOrder]);
      if (les.exercises) {
        let exOrder = 0;
        for (const ex of les.exercises) {
          exOrder++;
          db.run(`INSERT INTO exercises (id, lesson_id, title, instructions, starter_code, solution_code, language, points, order_num) VALUES (?,?,?,?,?,?,?,?,?)`,
            [uuidv4(), lesId, ex.title, ex.instructions, ex.starterCode, ex.solutionCode, ex.language, ex.points, exOrder]);
        }
      }
    }
  }

  // Course 3: JavaScript
  const jsId = uuidv4();
  db.run(`INSERT INTO courses (id, title, slug, description, short_description, level, published, category_id, teacher_id) VALUES (?,?,?,?,?,?,?,?,?)`,
    [jsId, 'JavaScript: Fundamentos e DOM', 'javascript-fundamentos',
    'Aprenda JavaScript do básico à manipulação do DOM. Curso prático com exercícios interativos.',
    'Fundamentos de JS e manipulação do DOM', 'BEGINNER', 1, catIds['javascript'], teacher2Id]);

  const jsModules = [
    { title: 'Introdução ao JavaScript', lessons: [
      { title: 'O que é JavaScript?', content: '<p>JavaScript é a linguagem da web, rodando no navegador e no servidor.</p>', duration: 10 },
      { title: 'Variáveis e Tipos', content: '<p>var, let, const e os tipos de dados do JS.</p>', duration: 15, exercises: [
        { title: 'Declaração de Variáveis', instructions: 'Declare uma variável com let chamada nome e atribua seu nome.', starterCode: 'let nome = ', solutionCode: 'let nome = "João"', language: 'javascript', points: 5 }
      ]}
    ]},
    { title: 'Funções e Arrays', lessons: [
      { title: 'Funções', content: '<p>Funções são blocos de código reutilizáveis.</p>', duration: 20, exercises: [
        { title: 'Função de Saudação', instructions: 'Crie uma função que receba um nome e retorne "Olá, [nome]!".', starterCode: 'function saudacao(nome) {\n    ', solutionCode: 'function saudacao(nome) {\n    return "Olá, " + nome + "!";\n}', language: 'javascript', points: 10 }
      ]},
      { title: 'Arrays e Métodos', content: '<p>Arrays armazenam coleções de dados.</p>', duration: 20 }
    ]},
    { title: 'Manipulação do DOM', lessons: [
      { title: 'Selecionando Elementos', content: '<p>Use querySelector e getElementById para acessar elementos.</p>', duration: 15 },
      { title: 'Eventos', content: '<p>Eventos permitem reagir a ações do usuário.</p>', duration: 15 },
      { title: 'Modificando o DOM', content: '<p>Altere conteúdo, estilos e atributos dos elementos.</p>', duration: 15, exercises: [
        { title: 'Lista Dinâmica', instructions: 'Crie uma função que adicione um item a uma lista no HTML.', starterCode: 'function adicionarItem() {\n    ', solutionCode: 'function adicionarItem() {\n    const ul = document.querySelector("ul");\n    const li = document.createElement("li");\n    li.textContent = "Novo item";\n    ul.appendChild(li);\n}', language: 'javascript', points: 15 }
      ]}
    ]},
    { title: 'Async/Await', lessons: [
      { title: 'Promises', content: '<p>Promises representam operações assíncronas.</p>', duration: 20 },
      { title: 'Async e Await', content: '<p>Sintaxe moderna para lidar com código assíncrono.</p>', duration: 20, exercises: [
        { title: 'Requisição API', instructions: 'Use fetch para buscar dados de uma API e exibir no console.', starterCode: 'async function buscarDados() {\n    ', solutionCode: 'async function buscarDados() {\n    const res = await fetch("https://api.example.com/dados");\n    const dados = await res.json();\n    console.log(dados);\n}', language: 'javascript', points: 15 }
      ]}
    ]}
  ];

  order = 0;
  for (const mod of jsModules) {
    order++;
    const modId = uuidv4();
    db.run(`INSERT INTO modules (id, course_id, title, order_num) VALUES (?,?,?,?)`, [modId, jsId, mod.title, order]);
    let lessOrder = 0;
    for (const les of mod.lessons) {
      lessOrder++;
      const lesId = uuidv4();
      db.run(`INSERT INTO lessons (id, module_id, title, content, duration, order_num) VALUES (?,?,?,?,?,?)`,
        [lesId, modId, les.title, les.content, les.duration, lessOrder]);
      if (les.exercises) {
        let exOrder = 0;
        for (const ex of les.exercises) {
          exOrder++;
          db.run(`INSERT INTO exercises (id, lesson_id, title, instructions, starter_code, solution_code, language, points, order_num) VALUES (?,?,?,?,?,?,?,?,?)`,
            [uuidv4(), lesId, ex.title, ex.instructions, ex.starterCode, ex.solutionCode, ex.language, ex.points, exOrder]);
        }
      }
    }
  }

  // Course 4: HTML e CSS
  const htmlId = uuidv4();
  db.run(`INSERT INTO courses (id, title, slug, description, short_description, level, published, category_id, teacher_id) VALUES (?,?,?,?,?,?,?,?,?)`,
    [htmlId, 'HTML e CSS: Criação de Sites', 'html-css-sites',
    'Aprenda a criar sites completos com HTML5 e CSS3. Desde a estrutura básica até layouts responsivos.',
    'Crie sites completos com HTML5 e CSS3', 'BEGINNER', 1, catIds['html'], teacher2Id]);

  const htmlModules = [
    { title: 'Fundamentos do HTML', lessons: [
      { title: 'Estrutura HTML', content: '<p>HTML é a linguagem de marcação para criar páginas web.</p>', duration: 15 },
      { title: 'Tags e Atributos', content: '<p>Tags definem elementos, atributos configuram comportamentos.</p>', duration: 20 }
    ]},
    { title: 'CSS: Estilizando a Página', lessons: [
      { title: 'Seletores CSS', content: '<p>Seletores permitem aplicar estilos a elementos específicos.</p>', duration: 20, exercises: [
        { title: 'Estilizando Títulos', instructions: 'Crie uma regra CSS que torne todos os h1 azuis e centralizados.', starterCode: 'h1 {\n    ', solutionCode: 'h1 {\n    color: blue;\n    text-align: center;\n}', language: 'css', points: 5 }
      ]},
      { title: 'Flexbox', content: '<p>Flexbox é um modelo de layout unidimensional.</p>', duration: 25 },
      { title: 'Grid Layout', content: '<p>CSS Grid permite layouts bidimensionais complexos.</p>', duration: 25, exercises: [
        { title: 'Grid Simples', instructions: 'Crie um grid de 3 colunas com gap de 10px.', starterCode: '.grid {\n    display: grid;\n    ', solutionCode: '.grid {\n    display: grid;\n    grid-template-columns: repeat(3, 1fr);\n    gap: 10px;\n}', language: 'css', points: 10 }
      ]}
    ]},
    { title: 'Projeto Final', lessons: [
      { title: 'Site Completo', content: '<p>Crie um site pessoal completo com HTML e CSS.</p>', duration: 30 }
    ]}
  ];

  order = 0;
  for (const mod of htmlModules) {
    order++;
    const modId = uuidv4();
    db.run(`INSERT INTO modules (id, course_id, title, order_num) VALUES (?,?,?,?)`, [modId, htmlId, mod.title, order]);
    let lessOrder = 0;
    for (const les of mod.lessons) {
      lessOrder++;
      const lesId = uuidv4();
      db.run(`INSERT INTO lessons (id, module_id, title, content, duration, order_num) VALUES (?,?,?,?,?,?)`,
        [lesId, modId, les.title, les.content, les.duration, lessOrder]);
      if (les.exercises) {
        let exOrder = 0;
        for (const ex of les.exercises) {
          exOrder++;
          db.run(`INSERT INTO exercises (id, lesson_id, title, instructions, starter_code, solution_code, language, points, order_num) VALUES (?,?,?,?,?,?,?,?,?)`,
            [uuidv4(), lesId, ex.title, ex.instructions, ex.starterCode, ex.solutionCode, ex.language, ex.points, exOrder]);
        }
      }
    }
  }

  // Badges
  const badges = [
    { name: 'Primeiro Login', slug: 'first-login', description: 'Faça seu primeiro login na plataforma' },
    { name: 'Primeiro Curso', slug: 'first-course', description: 'Matricule-se no seu primeiro curso' },
    { name: 'Primeiro Exercício', slug: 'first-exercise', description: 'Complete seu primeiro exercício' },
    { name: '10 Exercícios', slug: 'ten-exercises', description: 'Complete 10 exercícios' },
    { name: 'Curso Finalizado', slug: 'course-completed', description: 'Finalize um curso completo' },
    { name: 'Especialista em Python', slug: 'python-expert', description: 'Finalize o curso de Python' },
    { name: 'Especialista em JavaScript', slug: 'javascript-expert', description: 'Finalize o curso de JavaScript' },
    { name: 'Especialista em Java', slug: 'java-expert', description: 'Finalize o curso de Java' },
    { name: 'Aluno Destaque', slug: 'star-student', description: 'Acumule 100 pontos' }
  ];
  for (const b of badges) {
    db.run(`INSERT INTO badges (id, name, slug, description) VALUES (?,?,?,?)`, [uuidv4(), b.name, b.slug, b.description]);
  }

  // Site settings
  db.run(`INSERT OR IGNORE INTO site_settings (key, value) VALUES (?,?)`, ['welcomeVideo', '']);

  saveDb();
  console.log('Database seeded successfully!');
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
