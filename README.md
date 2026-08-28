# Ali Jan Communication

This is an e-commerce website I built with Node.js, Express and MongoDB on the backend, along with an admin panel to manage everything from products to banners.

I kept things simple on purpose — instead of building a full cart/checkout/payment system, orders are handled through WhatsApp. Customer just messages the number and the order gets confirmed that way. No customer login system either, and no offers/coupon module. Just the core store stuff.

## What's included

- Admin authentication (login system)
- Products - add, edit, delete, list
- Categories to organize products
- Brands
- Banners for the homepage
- Settings page to control store info from the admin panel

## Built with

- Node.js + Express
- MongoDB with Mongoose
- Admin panel frontend

## Folder layout

```
controllers/   -> all the logic (auth, product, category, brand, banner, settings)
models/        -> mongoose schemas
routes/        -> express routes, all mounted in server.js
admin/         -> admin panel pages
server.js      -> where it all starts
```

## Why WhatsApp instead of a full checkout?

Honestly, for the kind of store this is, a full payment gateway + cart system was overkill. WhatsApp ordering is faster for both the customer and the store owner, and it cuts down a LOT of dev time and moving parts that could break.

## Running it locally

```bash
npm install
cp .env.example .env
```

Then put your MongoDB connection string and other config values into `.env`, and run:

```bash
npm start
```

## Status

Backend is complete for Auth, Product, Category, Brand, Banner and Settings. Admin panel pages for Settings and Categories are done too.

## License

© All Rights Reserved. This code is publicly viewable for portfolio/demo purposes only. Copying, reusing, or redistributing any part of this project without permission is not allowed.
