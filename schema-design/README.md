# MongoDB Schema Design
 
The main focus is on **when to embed data and when to use references**.

---

# 1. Twitter Clone

The main collections are:

- `users`
- `tweets`
- `likes`
- `follows`
- `comments`

## Users

```text
users
- _id
- username
- email
- name
- bio
- profileImage
- createdAt
```

**Keep users in a separate collection.**

A user can create many tweets, comments, likes, and follows. If I copied the user information into every document, the same data would be repeated many times.

For example, when I need a user profile, I can directly query the `users` collection.

---

## Tweets

```text
tweets
- _id
- userId
- content
- createdAt
- updatedAt
- likeCount
- commentCount
```

`userId` refers to a document in the `users` collection.

**Use a reference for the user.**

A user can create hundreds or thousands of tweets. So I would not store all tweets inside the user document.

### Common queries

- Get all tweets by a user
- Get the latest tweets for a timeline
- Get one tweet
- Create or delete a tweet

---

## Likes

```text
likes
- _id
- tweetId
- userId
- createdAt
```

`tweetId` refers to a tweet and `userId` refers to a user.

**Use a separate collection.**

A popular tweet can have a huge number of likes. Keeping all likes inside the tweet document could make the document very large.

### Common queries

- Like a tweet
- Unlike a tweet
- Check if a user liked a tweet
- Count likes
- Find users who liked a tweet

---

## Follows

```text
follows
- _id
- followerId
- followingId
- createdAt
```

**Use a separate collection.**

Following is a many-to-many relationship. One user can follow many people, and one user can also have many followers.

Keeping this relationship in its own collection makes it easier to query.

### Common queries

- Get a user's followers
- Get users followed by a user
- Follow/unfollow a user
- Check whether one user follows another

---

## Comments

```text
comments
- _id
- tweetId
- userId
- content
- createdAt
```

**Use a separate collection.**

A tweet can receive many comments, so storing all comments inside the tweet could create a very large document.

### Common queries

- Get comments for a tweet
- Add a comment
- Delete a comment
- Get comments written by a user

### Twitter structure

```text
users
  |
  +---- tweets
  |       |
  |       +---- likes
  |       |
  |       +---- comments
  |
  +---- follows
```

**In short:** I would use references for tweets, likes, follows, and comments because these things can grow independently.

---

# 2. E-commerce

The main collections are:

- `users`
- `products`
- `orders`
- `reviews`
- `categories`

## Users

```text
users
- _id
- name
- email
- passwordHash
- phone
- addresses[]
```

**Keep users in a separate collection, but embed addresses.**

The user needs to exist independently, so users should have their own collection.

Addresses are different. Usually a user has only a few addresses, and they are normally needed when the user profile is loaded. So keeping them inside the user document is convenient.

---

## Products

```text
products
- _id
- name
- description
- price
- stock
- categoryId
- images[]
- rating
- createdAt
```

`categoryId` refers to the `categories` collection.

**Reference the category and embed the images.**

A product can be searched and viewed independently. A category can also contain many products, so I would store the category separately.

Images are normally a small list and are loaded together with the product, so embedding them makes sense.

### Common queries

- Get a product
- Search products
- Get products by category
- Check product stock
- List products

---

## Categories

```text
categories
- _id
- name
- description
```

**Use a separate collection.**

One category can contain many products.

For example:

```text
Electronics
  |
  +-- Laptop
  +-- Phone
  +-- Monitor
```

So I would not copy the whole category document into every product.

---

## Orders

```text
orders
- _id
- userId
- status
- totalAmount
- items[]
- createdAt
```

Each item can contain:

```text
- productId
- productName
- price
- quantity
```

**Reference the user but embed the order items.**

When a customer opens an order, they normally want to see the order and its items together. Therefore, embedding the items makes the read simple.

I would also keep `productName` and `price` inside the order item as a snapshot.

For example, if a product costs ₹100 today but was ₹80 when the customer bought it, the old order should still show ₹80.

### Common queries

- Get a user's orders
- Get order details
- Get items in an order
- Update order status

---

## Reviews

```text
reviews
- _id
- userId
- productId
- rating
- comment
- createdAt
```

**Use a separate collection.**

A product can have many reviews. Reviews are also useful on their own, so keeping them separately makes more sense.

### Common queries

- Get reviews for a product
- Get reviews written by a user
- Add/delete a review
- Calculate average rating

### E-commerce structure

```text
users
  |
  +---- orders
  |       |
  |       +---- items[]  <-- embedded
  |
  +---- reviews

products
  |
  +---- categoryId ------> categories
```

I would embed order items because they belong to the order and are normally read together. I would use references for users, products, categories, and reviews because they are independent data.

---

# 3. Blog

The main collections are:

- `users`
- `posts`
- `comments`
- `tags`

## Users

```text
users
- _id
- name
- email
- bio
- profileImage
- createdAt
```

**Use a separate collection.**

A user can create many posts and comments, so the user should not be copied into every post.

---

## Posts

```text
posts
- _id
- authorId
- title
- content
- slug
- tagIds[]
- publishedAt
- status
- commentCount
```

`authorId` refers to `users`.

`tagIds` refers to `tags`.

**Reference the author and tags.**

A user can write many posts, so referencing the user avoids duplicating user information.

Tags can also be used by many different posts, so I would keep tags separately and store their IDs in the post.

### Common queries

- Get a post by slug
- Get posts by an author
- Get all published posts
- Find posts by tag

---

## Comments

```text
comments
- _id
- postId
- userId
- content
- createdAt
```

**Use a separate collection.**

A popular blog post can have many comments. If all comments were stored inside the post, the post document could become very large.

### Common queries

- Get comments for a post
- Add a comment
- Delete a comment
- Get comments by a user

---

## Tags

```text
tags
- _id
- name
```

**Use a separate collection.**

The same tag can be used by many posts.

For example:

```text
JavaScript
   |
   +---- Post 1
   +---- Post 5
   +---- Post 10
```

This is a many-to-many relationship, so references are a good choice.

### Blog structure

```text
users
  |
  +---- posts
          |
          +---- comments
          |
          +---- tagIds[] ------> tags
```

 I would use references for users, comments, and tags because they can be shared or can grow separately.

---

# 4. Final Embed vs Reference Summary

| Application | Data | Decision | Why? |
|---|---|---|---|
| Twitter | User → Tweets | Reference | A user can have many tweets |
| Twitter | Tweet → Likes | Reference | A tweet can have many likes |
| Twitter | User → Follows | Reference | Many-to-many relationship |
| Twitter | Tweet → Comments | Reference | Comments can grow a lot |
| E-commerce | User → Addresses | Embed | Usually small and loaded with user |
| E-commerce | Product → Images | Embed | Small data usually loaded with product |
| E-commerce | Product → Category | Reference | Category is shared |
| E-commerce | Order → Items | Embed | Order and items are usually read together |
| E-commerce | Product → Reviews | Reference | A product can have many reviews |
| Blog | User → Posts | Reference | A user can create many posts |
| Blog | Post → Comments | Reference | Comments can grow a lot |
| Blog | Post → Tags | Reference | Tags are shared between posts |

---

# 5. Main Things I Considered

When deciding between embedding and referencing, I mainly considered:

1. **How the data will be queried.**
2. **Whether the related data is usually needed together.**
3. **How large the related data can become.**
4. **Whether the data is shared by multiple documents.**
5. **Whether the relationship is one-to-one, one-to-many, or many-to-many.**

> If the data is small and normally used together, embed it.

> If the data can grow a lot, is shared, or is queried separately, use a reference.

