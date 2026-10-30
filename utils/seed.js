const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('./db');

function seedData() {
  let users = readDB('users');

  if (users.length === 0) {
    const hashedAdminPw = bcrypt.hashSync('admin123', 10);
    const hashedStudentPw = bcrypt.hashSync('student123', 10);

    users = [
      {
        id: 'u-admin-001',
        name: 'Alex Rivera (Admin)',
        email: 'admin@quiz.com',
        password: hashedAdminPw,
        role: 'admin',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        avatar: 'A',
        xp: 2450,
        level: 'Grandmaster',
        streak: 14,
        badges: ['first_quiz', 'perfect_score', 'speed_demon', 'quiz_master', 'streak_7']
      },
      {
        id: 'u-student-001',
        name: 'Sarah Chen',
        email: 'student@quiz.com',
        password: hashedStudentPw,
        role: 'student',
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        avatar: 'S',
        xp: 1350,
        level: 'Scholar',
        streak: 5,
        badges: ['first_quiz', 'perfect_score', 'streak_3']
      },
      {
        id: 'u-student-002',
        name: 'Marcus Vance',
        email: 'marcus@quiz.com',
        password: hashedStudentPw,
        role: 'student',
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        avatar: 'M',
        xp: 920,
        level: 'Apprentice',
        streak: 2,
        badges: ['first_quiz', 'speed_demon']
      },
      {
        id: 'u-student-003',
        name: 'Priya Sharma',
        email: 'priya@quiz.com',
        password: hashedStudentPw,
        role: 'student',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        avatar: 'P',
        xp: 1800,
        level: 'Master',
        streak: 8,
        badges: ['first_quiz', 'perfect_score', 'streak_7', 'speed_demon']
      }
    ];
    writeDB('users', users);
  }

  let quizzes = [
    {
      id: 'q-js-001',
      title: 'Full-Stack JavaScript & Modern ESNext',
      description: 'Comprehensive multi-format assessment: Closures, Event Loop, Promises, Async/Await, Multi-Select, Fill-in-Blanks & True/False.',
      category: 'Programming',
      difficulty: 'Medium',
      duration: 15,
      passingScore: 70,
      negativeMarking: 0.25,
      isPublished: true,
      proctored: true,
      icon: '⚡',
      tags: ['JavaScript', 'ES6+', 'Web Dev', 'Fullstack'],
      createdBy: 'u-admin-001',
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: 'qjs-1',
          type: 'single',
          difficulty: 'Medium',
          text: 'What is the output of the following asynchronous JavaScript execution?',
          codeSnippet: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');`,
          options: ['1, 2, 3, 4', '1, 4, 3, 2', '1, 4, 2, 3', '1, 3, 4, 2'],
          correctAnswer: 1,
          hint: 'Microtasks (Promises) execute before Macrotasks (setTimeout) in the Event Loop queue.',
          explanation: 'Synchronous statements run first (1, 4). Then the microtask queue resolves (3), followed by the macrotask queue (2).'
        },
        {
          id: 'qjs-2',
          type: 'multiple',
          difficulty: 'Hard',
          text: 'Which of the following are primitive data types in JavaScript? (Select ALL that apply)',
          options: ['Symbol', 'Object', 'BigInt', 'Array'],
          correctAnswers: [0, 2],
          hint: 'There are 7 primitives: string, number, bigint, boolean, undefined, symbol, null.',
          explanation: 'Symbol and BigInt are primitive data types. Object and Array are reference types.'
        },
        {
          id: 'qjs-3',
          type: 'boolean',
          difficulty: 'Easy',
          text: 'True or False: The "===" operator performs type coercion before comparison.',
          options: ['True', 'False'],
          correctAnswer: 1, // False
          hint: '=== is the strict equality operator.',
          explanation: 'False. The strict equality operator (===) does NOT perform type coercion; it requires both operands to have the same type.'
        },
        {
          id: 'qjs-4',
          type: 'fill_blank',
          difficulty: 'Medium',
          text: 'Fill in the blank: A function bundled together with references to its surrounding lexical state is known as a ________.',
          correctText: 'closure',
          hint: 'Begins with "cl..." and preserves outer variable references.',
          explanation: 'A closure is the combination of a function bundled together with references to its lexical environment.'
        },
        {
          id: 'qjs-5',
          type: 'ordering',
          difficulty: 'Hard',
          text: 'Arrange the phases of the JavaScript Event Loop in order of execution from top to bottom:',
          options: ['Execute Synchronous Call Stack', 'Drain Microtask Queue (Promises)', 'Execute Next Macrotask (Timers)', 'Browser DOM Render / Repaint'],
          correctOrder: [0, 1, 3, 2],
          hint: 'Synchronous runs first, then microtasks, then render, then timer macrotasks.',
          explanation: 'Execution order: Synchronous Call Stack → Microtask queue → Visual repaint → Timer Macrotask queue.'
        }
      ]
    },
    {
      id: 'q-dsa-002',
      title: 'System Design & Algorithmic Complexity',
      description: 'Test your mastery of big-O notation, trees, distributed caching, and algorithmic trade-offs.',
      category: 'Computer Science',
      difficulty: 'Hard',
      duration: 20,
      passingScore: 75,
      negativeMarking: 0.33,
      isPublished: true,
      proctored: true,
      icon: '🧠',
      tags: ['DSA', 'Algorithms', 'System Design', 'Big-O'],
      createdBy: 'u-admin-001',
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: 'qdsa-1',
          type: 'single',
          difficulty: 'Medium',
          text: 'What is the average time complexity of searching in a Balanced Binary Search Tree (AVL / Red-Black Tree)?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
          correctAnswer: 1,
          hint: 'Height of a balanced tree is logarithmic relative to node count.',
          explanation: 'Because AVL/Red-Black trees maintain a maximum height of O(log n), operations take O(log n) time.'
        },
        {
          id: 'qdsa-2',
          type: 'boolean',
          difficulty: 'Easy',
          text: 'True or False: A Stack data structure follows First-In, First-Out (FIFO) principle.',
          options: ['True', 'False'],
          correctAnswer: 1, // False
          hint: 'Think about a stack of plates.',
          explanation: 'False. A Stack operates on LIFO (Last-In, First-Out). Queues operate on FIFO.'
        },
        {
          id: 'qdsa-3',
          type: 'multiple',
          difficulty: 'Hard',
          text: 'Which of the following sorting algorithms have an average time complexity of O(n log n)? (Select all)',
          options: ['Merge Sort', 'Heap Sort', 'Bubble Sort', 'Insertion Sort'],
          correctAnswers: [0, 1],
          hint: 'Look for divide-and-conquer and heap-based algorithms.',
          explanation: 'Merge Sort and Heap Sort run in O(n log n) average time. Bubble Sort and Insertion Sort are O(n²).'
        }
      ]
    },
    {
      id: 'q-cloud-003',
      title: 'Cloud Computing, DevOps & Microservices',
      description: 'Docker containers, Kubernetes orchestration, CI/CD pipelines, and cloud security architecture.',
      category: 'DevOps & Cloud',
      difficulty: 'Medium',
      duration: 12,
      passingScore: 60,
      negativeMarking: 0,
      isPublished: true,
      proctored: false,
      icon: '☁️',
      tags: ['Docker', 'Kubernetes', 'AWS', 'DevOps', 'Security'],
      createdBy: 'u-admin-001',
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: 'qcloud-1',
          type: 'single',
          difficulty: 'Medium',
          text: 'What is the primary role of an Ingress Controller in a Kubernetes cluster?',
          options: [
            'To encrypt nodes at hardware firmware level',
            'To manage external HTTP/HTTPS access and reverse-proxy traffic to internal Services',
            'To compile container images on the fly',
            'To monitor container memory leaks'
          ],
          correctAnswer: 1,
          hint: 'Think of Nginx acting as an entry gateway to cluster services.',
          explanation: 'An Ingress Controller acts as an intelligent router exposing HTTP/HTTPS routes from outside the cluster to services within.'
        },
        {
          id: 'qcloud-2',
          type: 'fill_blank',
          difficulty: 'Easy',
          text: 'Fill in the blank: The standard tool used for defining and running multi-container Docker applications via YAML is called Docker ________.',
          correctText: 'compose',
          hint: 'Spelled c-o-m-p-o-s-e.',
          explanation: 'Docker Compose allows you to define services, networks, and volumes in a single docker-compose.yml file.'
        }
      ]
    }
  ];

  writeDB('quizzes', quizzes);
  console.log('✅ Rich Multi-Format Quizzes seeded successfully');
}

module.exports = { seedData };
