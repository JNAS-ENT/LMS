export const VAULT_SECRET = 'vault-a8f7k2m9x1';

export const KB_CATEGORIES = [
  'Python',
  'SQL',
  'Machine Learning',
  'Deep Learning',
  'Generative AI',
  'LLM Engineering',
  'MLOps',
  'Data Engineering',
  'Cloud Computing',
  'System Design',
  'Career Development',
  'Leadership',
  'Business',
] as const;

export type KBCategory = (typeof KB_CATEGORIES)[number];

export const CODE_LANGUAGES = ['Python', 'SQL', 'JavaScript', 'Bash', 'PowerShell'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const PROJECT_STATUSES = ['Planned', 'Active', 'Completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const ROADMAP_STATUSES = ['Not Started', 'In Progress', 'Completed'] as const;
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number];

export const BOOKMARK_CATEGORIES = ['YouTube', 'GitHub', 'Courses', 'Blogs', 'Documentation'] as const;
export type BookmarkCategory = (typeof BOOKMARK_CATEGORIES)[number];

export const NOTE_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Yellow', value: '#FEF3C7' },
  { name: 'Green', value: '#D1FAE5' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Pink', value: '#FCE7F3' },
  { name: 'Purple', value: '#EDE9FE' },
  { name: 'Orange', value: '#FFEDD5' },
];

// Syllabus Templates
export type SyllabusTemplate = {
  name: string;
  subject: string;
  modules: { name: string; topics: string[] }[];
};

export const SYLLABUS_TEMPLATES: SyllabusTemplate[] = [
  {
    name: 'Machine Learning',
    subject: 'Machine Learning',
    modules: [
      { name: 'Foundations', topics: ['Introduction to ML', 'Types of Machine Learning', 'Mathematics for ML', 'Python for ML', 'Data Preprocessing'] },
      { name: 'Supervised Learning', topics: ['Linear Regression', 'Logistic Regression', 'Decision Trees', 'Random Forests', 'Support Vector Machines', 'K-Nearest Neighbors'] },
      { name: 'Ensemble Methods', topics: ['Bagging', 'Boosting', 'AdaBoost', 'Gradient Boosting', 'XGBoost', 'LightGBM'] },
      { name: 'Model Evaluation', topics: ['Cross-Validation', 'Confusion Matrix', 'Precision & Recall', 'ROC Curves', 'Hyperparameter Tuning'] },
      { name: 'Unsupervised Learning', topics: ['K-Means Clustering', 'Hierarchical Clustering', 'DBSCAN', 'Principal Component Analysis', 't-SNE'] },
      { name: 'Advanced Topics', topics: ['Neural Networks Basics', 'Feature Engineering', 'Model Deployment', 'ML Pipelines', 'AutoML'] },
    ],
  },
  {
    name: 'Deep Learning',
    subject: 'Deep Learning',
    modules: [
      { name: 'Neural Networks', topics: ['Perceptrons', 'Activation Functions', 'Backpropagation', 'Gradient Descent', 'Loss Functions'] },
      { name: 'CNNs', topics: ['Convolutional Layers', 'Pooling Layers', 'CNN Architectures', 'Image Classification', 'Object Detection'] },
      { name: 'RNNs', topics: ['Recurrent Layers', 'LSTM', 'GRU', 'Sequence Modeling', 'Time Series Forecasting'] },
      { name: 'Transformers', topics: ['Attention Mechanism', 'Self-Attention', 'Multi-Head Attention', 'Positional Encoding', 'Transformer Architecture'] },
      { name: 'Generative Models', topics: ['Autoencoders', 'VAEs', 'GANs', 'Diffusion Models', 'Image Generation'] },
      { name: 'Best Practices', topics: ['Transfer Learning', 'Fine-tuning', 'Regularization', 'Data Augmentation', 'Model Optimization'] },
    ],
  },
  {
    name: 'NLP',
    subject: 'Natural Language Processing',
    modules: [
      { name: 'Text Processing', topics: ['Tokenization', 'Stemming & Lemmatization', 'Stop Words', 'Text Normalization', 'Regular Expressions'] },
      { name: 'Representations', topics: ['Bag of Words', 'TF-IDF', 'Word Embeddings', 'Word2Vec', 'GloVe', 'FastText'] },
      { name: 'Language Models', topics: ['N-grams', 'Language Modeling', 'Perplexity', 'Neural Language Models', 'Pre-training Concepts'] },
      { name: 'Sequence Tasks', topics: ['POS Tagging', 'Named Entity Recognition', 'Chunking', 'Dependency Parsing', 'Semantic Role Labeling'] },
      { name: 'Applications', topics: ['Text Classification', 'Sentiment Analysis', 'Question Answering', 'Summarization', 'Machine Translation'] },
      { name: 'Modern NLP', topics: ['BERT Architecture', 'GPT Models', 'Fine-tuning BERT', 'Prompt Engineering', 'RLHF'] },
    ],
  },
  {
    name: 'LLM Engineering',
    subject: 'LLM Engineering',
    modules: [
      { name: 'LLM Fundamentals', topics: ['Transformer Architecture Review', 'Attention Mechanisms', 'Tokenization Strategies', 'Context Windows', 'Language Model Types'] },
      { name: 'Prompt Engineering', topics: ['Prompt Design', 'Few-shot Learning', 'Chain-of-Thought', 'ReAct Pattern', 'Prompt Templates'] },
      { name: 'Retrieval-Augmented Generation', topics: ['RAG Architecture', 'Vector Databases', 'Embedding Models', 'Chunking Strategies', 'Retrieval Methods'] },
      { name: 'Fine-Tuning', topics: ['Supervised Fine-tuning', 'LoRA', 'QLoRA', 'PEFT', 'Instruction Tuning'] },
      { name: 'Evaluation', topics: ['Perplexity', 'BLEU & ROUGE', 'Human Evaluation', 'LLM Benchmarks', 'Safety Evaluation'] },
      { name: 'Production', topics: ['API Integration', 'LangChain', 'LlamaIndex', 'Cost Optimization', 'Latency Optimization'] },
    ],
  },
  {
    name: 'Python',
    subject: 'Python Programming',
    modules: [
      { name: 'Basics', topics: ['Variables & Data Types', 'Operators', 'Control Flow', 'Functions', 'Modules & Packages'] },
      { name: 'Data Structures', topics: ['Lists', 'Tuples', 'Dictionaries', 'Sets', 'Comprehensions'] },
      { name: 'Object-Oriented Programming', topics: ['Classes & Objects', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Magic Methods'] },
      { name: 'Advanced Python', topics: ['Decorators', 'Generators', 'Context Managers', 'Iterators', 'Async Programming'] },
      { name: 'File Handling & I/O', topics: ['Reading Files', 'Writing Files', 'Working with CSV', 'Working with JSON', 'Pathlib'] },
      { name: 'Testing & Debugging', topics: ['Unit Testing', 'Pytest', 'Debugging Techniques', 'Logging', 'Error Handling'] },
    ],
  },
  {
    name: 'SQL',
    subject: 'SQL & Databases',
    modules: [
      { name: 'SQL Basics', topics: ['SELECT Statements', 'WHERE Clause', 'ORDER BY', 'LIMIT & OFFSET', 'Aggregate Functions'] },
      { name: 'Joins', topics: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'Self Join', 'Cross Join'] },
      { name: 'Advanced Queries', topics: ['Subqueries', 'Common Table Expressions', 'Window Functions', 'GROUP BY Extensions', 'CASE Expressions'] },
      { name: 'Data Modification', topics: ['INSERT', 'UPDATE', 'DELETE', 'UPSERT', 'Transactions'] },
      { name: 'Schema Design', topics: ['CREATE TABLE', 'Data Types', 'Constraints', 'Indexes', 'Normalization'] },
      { name: 'Performance', topics: ['Query Optimization', 'Index Strategies', 'Execution Plans', 'Database Tuning', 'Partitioning'] },
    ],
  },
  {
    name: 'Data Science',
    subject: 'Data Science',
    modules: [
      { name: 'Data Manipulation', topics: ['Pandas Basics', 'Data Cleaning', 'Data Transformation', 'Merging DataFrames', 'Handling Missing Data'] },
      { name: 'Exploratory Data Analysis', topics: ['Descriptive Statistics', 'Data Visualization', 'Correlation Analysis', 'Outlier Detection', 'Feature Distributions'] },
      { name: 'Visualisation', topics: ['Matplotlib', 'Seaborn', 'Plotly', 'Interactive Charts', 'Dashboard Design'] },
      { name: 'Statistical Analysis', topics: ['Hypothesis Testing', 'A/B Testing', 'Confidence Intervals', 'Statistical Significance', 'Bayesian Statistics'] },
      { name: 'Feature Engineering', topics: ['Feature Selection', 'Feature Extraction', 'Encoding Categorical Variables', 'Scaling & Normalization', 'Dimensionality Reduction'] },
      { name: 'ML Workflows', topics: ['Scikit-learn Pipeline', 'Model Selection', 'Cross-Validation', 'Hyperparameter Optimization', 'Model Interpretability'] },
    ],
  },
  {
    name: 'MLOps',
    subject: 'MLOps',
    modules: [
      { name: 'ML Lifecycle', topics: ['ML Workflow Overview', 'Experiment Tracking', 'Model Versioning', 'Model Registry', 'Model Staging'] },
      { name: 'Experiment Management', topics: ['MLflow', 'Weights & Biases', 'DVC', 'Experiment Comparison', 'Reproducibility'] },
      { name: 'Model Deployment', topics: ['REST APIs', 'Batch Inference', 'Real-time Inference', 'Containerization', 'Kubernetes for ML'] },
      { name: 'Monitoring', topics: ['Model Monitoring', 'Data Drift', 'Concept Drift', 'Performance Alerts', 'Logging & Alerting'] },
      { name: 'Pipelines', topics: ['Data Pipelines', 'Training Pipelines', 'CI/CD for ML', 'Workflow Orchestration', 'Airflow'] },
      { name: 'Infrastructure', topics: ['Cloud ML Services', 'GPU Management', 'Model Serving', 'Auto-scaling', 'Cost Optimization'] },
    ],
  },
  {
    name: 'AI Infrastructure',
    subject: 'AI Infrastructure',
    modules: [
      { name: 'Compute Infrastructure', topics: ['CPU vs GPU', 'TPUs', 'Distributed Training', 'Multi-node Clusters', 'Cloud Compute Options'] },
      { name: 'Storage', topics: ['Data Lakes', 'Object Storage', 'Distributed File Systems', 'Vector Databases', 'Feature Stores'] },
      { name: 'Networking', topics: ['High-speed Interconnects', 'Data Transfer Optimization', 'Network Topology', 'Bandwidth Considerations', 'Latency Optimization'] },
      { name: 'Orchestration', topics: ['Container Orchestration', 'Kubernetes Basics', 'Kubernetes for ML', 'Helm Charts', 'Custom Resources'] },
      { name: 'Security', topics: ['Data Security', 'Model Security', 'Access Control', 'Encryption', 'Compliance'] },
      { name: 'Scalability', topics: ['Horizontal Scaling', 'Vertical Scaling', 'Load Balancing', 'Auto-scaling Strategies', 'Cost Management'] },
    ],
  },
  {
    name: 'AI Architecture',
    subject: 'AI System Architecture',
    modules: [
      { name: 'Design Principles', topics: ['AI System Components', 'Design Patterns', 'Trade-offs', 'Requirements Analysis', 'Architecture Documentation'] },
      { name: 'Data Architecture', topics: ['Data Ingestion', 'Data Processing', 'Feature Engineering Pipeline', 'Data Versioning', 'Data Quality'] },
      { name: 'Model Architecture', topics: ['Model Selection', 'Model Composition', 'Ensemble Patterns', 'Model Registry', 'Model Governance'] },
      { name: 'Serving Architecture', topics: ['Serving Patterns', 'Batch vs Online', 'Model Caching', 'A/B Testing Infrastructure', 'Model Routing'] },
      { name: 'Production Concerns', topics: ['Reliability', 'Scalability', 'Maintainability', 'Monitoring Strategy', 'Disaster Recovery'] },
      { name: 'Case Studies', topics: ['Recommendation Systems', 'Search Systems', 'Fraud Detection', 'Content Moderation', 'Real-time Inference'] },
    ],
  },
];
