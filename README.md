# expressjs-classy-controllers-es6

Reducing boilerplate code for typical controllers.
This is **ES2015-only library**, to use it, you'll need iojs >= 2.3 with `--harmony_arrow_functions`.

## AbstractController

Very basic controller, doing nothing.

## StaticController

Simple controller, serving one static page. If you override `getData(req, res)` in child class it is possible to pass
dynamic data to that page.

## CRUDController

Provides several URLs, works with Mongoose >= 4.x, but can be repurposed to any Promise-based O(R|D)M.
CRUDController needs two views: `list` and `item`. List shows list of all items in given collection and item is form for
 showing/editing single item. `list` can contain form to create new item.

## CRUDSequelize

Same as CRUDController, but instead of Mongoose works with [sequelize.js](http://sequelizejs.com) models. Please note
that current implementation will have problem displaying page after updating model in DBs other than PostgreSQL.