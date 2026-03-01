import {
  BillingUsageFact,
  BillingUpload,
  CloudAccount,
  Region,
  Service,
} from '../../../models/index.js';
import Sequelize from '../../../config/db.config.js';
import { Op } from 'sequelize';

export const dashboardRepository = {
  async getFilterOptions(uploadIds = []) {
    if (!Array.isArray(uploadIds) || uploadIds.length === 0) {
      return { providers: ['All'], services: ['All'], regions: ['All'] };
    }

    const whereFact = { uploadid: { [Op.in]: uploadIds } };

    const [providers, services, regions] = await Promise.all([
      BillingUsageFact.findAll({
        where: whereFact,
        include: [{ model: CloudAccount, as: 'cloudAccount', attributes: [], required: true }],
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('cloudAccount.providername')), 'value']],
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereFact,
        include: [{ model: Service, as: 'service', attributes: [], required: true }],
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('service.servicename')), 'value']],
        order: [[Sequelize.col('value'), 'ASC']],
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereFact,
        include: [{ model: Region, as: 'region', attributes: [], required: true }],
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('region.regionname')), 'value']],
        order: [[Sequelize.col('value'), 'ASC']],
        raw: true,
      }),
    ]);

    return {
      providers: ['All', ...providers.map((p) => p.value).filter(Boolean)],
      services: ['All', ...services.map((s) => s.value).filter(Boolean)],
      regions: ['All', ...regions.map((r) => r.value).filter(Boolean)],
    };
  },

  async getOverviewAggregates(whereClause = {}, monthExpr, uploadIds = []) {
    return Promise.all([
      BillingUsageFact.sum('billedcost', { where: whereClause }),
      BillingUsageFact.findAll({
        where: whereClause,
        attributes: [
          [Sequelize.fn('DATE', Sequelize.col('BillingUsageFact.chargeperiodstart')), 'date'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'cost'],
        ],
        group: [Sequelize.fn('DATE', Sequelize.col('BillingUsageFact.chargeperiodstart'))],
        order: [[Sequelize.fn('DATE', Sequelize.col('BillingUsageFact.chargeperiodstart')), 'ASC']],
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        include: [{ model: Service, as: 'service', required: true, attributes: [] }],
        attributes: [
          [Sequelize.col('service.servicename'), 'name'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'value'],
        ],
        group: [Sequelize.col('service.servicename')],
        order: [[Sequelize.literal('value'), 'DESC']],
        limit: 15,
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        include: [{ model: Region, as: 'region', required: true, attributes: [] }],
        attributes: [
          [Sequelize.col('region.regionname'), 'name'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'value'],
        ],
        group: [Sequelize.col('region.regionname')],
        order: [[Sequelize.literal('value'), 'DESC']],
        limit: 1,
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        include: [{ model: CloudAccount, as: 'cloudAccount', required: true, attributes: [] }],
        attributes: [
          [Sequelize.col('cloudAccount.providername'), 'name'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'value'],
        ],
        group: [Sequelize.col('cloudAccount.providername')],
        order: [[Sequelize.literal('value'), 'DESC']],
        limit: 1,
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        include: [{ model: Region, as: 'region', required: true, attributes: [] }],
        attributes: [
          [Sequelize.col('region.regionname'), 'name'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'value'],
        ],
        group: [Sequelize.col('region.regionname')],
        order: [[Sequelize.literal('value'), 'DESC']],
        raw: true,
      }),
      BillingUsageFact.findOne({
        where: {
          ...whereClause,
          [Op.or]: [{ tags: { [Op.is]: null } }, { tags: { [Op.eq]: {} } }],
        },
        attributes: [[Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'total']],
        raw: true,
      }),
      BillingUsageFact.findOne({
        where: { ...whereClause, resourceid: { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] } },
        attributes: [[Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'total']],
        raw: true,
      }),
      BillingUsageFact.findOne({
        where: whereClause,
        attributes: [
          [Sequelize.fn('MIN', Sequelize.col('BillingUsageFact.billingperiodstart')), 'billingStart'],
          [Sequelize.fn('MAX', Sequelize.col('BillingUsageFact.billingperiodend')), 'billingEnd'],
          [Sequelize.fn('MIN', Sequelize.col('BillingUsageFact.chargeperiodstart')), 'chargeStart'],
          [Sequelize.fn('MAX', Sequelize.col('BillingUsageFact.chargeperiodend')), 'chargeEnd'],
        ],
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        attributes: [
          [monthExpr, 'month'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'value'],
        ],
        group: [monthExpr],
        order: [[monthExpr, 'DESC']],
        limit: 2,
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        include: [{ model: CloudAccount, as: 'cloudAccount', required: true, attributes: [] }],
        attributes: [
          [Sequelize.col('cloudAccount.providername'), 'provider'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'value'],
        ],
        group: [Sequelize.col('cloudAccount.providername')],
        order: [[Sequelize.literal('value'), 'DESC']],
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        attributes: [
          [monthExpr, 'month'],
          [
            Sequelize.literal(
              'SUM(GREATEST(COALESCE("BillingUsageFact"."listcost",0) - COALESCE("BillingUsageFact"."effectivecost",0), 0))'
            ),
            'value',
          ],
        ],
        group: [monthExpr],
        order: [[monthExpr, 'DESC']],
        limit: 2,
        raw: true,
      }),
      BillingUpload.findOne({
        where: { uploadid: { [Op.in]: uploadIds } },
        attributes: ['uploadid', 'uploadedat'],
        order: [['uploadedat', 'DESC']],
        raw: true,
      }),
    ]);
  },
};
