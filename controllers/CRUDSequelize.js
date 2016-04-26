'use strict';

const CRUDController = require('./CRUD');

class CRUDSequelizeController extends CRUDController {
    /**
     * Extracts id from request, always int (RDBMS indexes are almost always ints)
     * @param {Request} req
     * @returns {number}
     * @protected
     */
    _getId(req) {
        return parseInt(super._getId(req));
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise}
     * @protected
     */
    _listRequest(req, res) {
        return this.model.findAll(this.listQuery(req, res));
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise}
     * @protected
     */
    _createRequest(req, res) { // eslint-disable-line no-unused-vars
        return this.model.create(req.parsed);
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise}
     * @protected
     */
    _updateRequest(req, res) { // eslint-disable-line no-unused-vars
        const id = this._getId(req);
        const options = {
            where: {id,},
            returning: true, // this is working only with Postgre
        };

        return new Promise((resolve, reject) => {
            this.model.update(req.parsed, options).then(
                (updateQueryResult) => {
                    resolve(updateQueryResult[1][0].dataValues);
                },
                reject
            );
        });
    }

    /**
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise}
     * @protected
     */
    _destroyRequest(req, res) { // eslint-disable-line no-unused-vars
        const id = this._getId(req);
        return this.model.destroy({where: {id,},});
    }
}

module.exports = CRUDSequelizeController;