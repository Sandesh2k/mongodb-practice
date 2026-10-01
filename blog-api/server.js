const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

const User = require('./models/User');
const Post = require('./models/Post');

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blog_api')
  .then(() => console.log('MongoDB connected'))
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/users', async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'name and email are required' });
  }

  try {
    const user = await User.create({ name, email });
    return res.status(201).json(user);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.post('/posts', async (req, res) => {
  const { title, body, author } = req.body;

  if (!title || !body || !author) {
    return res.status(400).json({ message: 'title, body, and author are required' });
  }

  try {
    const post = await Post.create({ title, body, author });
    const populatedPost = await post.populate('author', 'name');
    return res.status(201).json(populatedPost);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'name').sort({ createdAt: -1 });
    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name')
      .populate({ path: 'comments.author', select: 'name' });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.json(post);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.post('/posts/:id/comments', async (req, res) => {
  const { author, body } = req.body;

  if (!author || !body) {
    return res.status(400).json({ message: 'author and body are required' });
  }

  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      author,
      body,
      createdAt: new Date(),
    });

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name')
      .populate({ path: 'comments.author', select: 'name' });

    return res.status(201).json(populatedPost);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = { app };
