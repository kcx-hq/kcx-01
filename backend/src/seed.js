// seeders/20260103-billing-column-mapping.js
'use strict';

import { v4 as uuidv4 } from 'uuid';

/**
 * BillingColumnMapping seed for generic CSV columns
 * - source_column: original CSV header
 * - normalized_column: lowercased + safe for matching
 */
export const mappings = [
  { internal_field: 'providername', source_column: 'ProviderName' },
  { internal_field: 'billingaccountid', source_column: 'BillingAccountId' },
  { internal_field: 'billingaccountname', source_column: 'BillingAccountName' },
  { internal_field: 'billingcurrency', source_column: 'BillingCurrency' },
  { internal_field: 'invoiceissuername', source_column: 'InvoiceIssuerName' },
  { internal_field: 'publishername', source_column: 'PublisherName' },
  { internal_field: 'servicecategory', source_column: 'ServiceCategory' },
  { internal_field: 'servicename', source_column: 'ServiceName' },
  { internal_field: 'regioncode', source_column: 'RegionId' },
  { internal_field: 'regionname', source_column: 'RegionName' },
  { internal_field: 'availabilityzone', source_column: 'AvailabilityZone' },
  { internal_field: 'skuid', source_column: 'SkuId' },
  { internal_field: 'skupriceid', source_column: 'SkuPriceId' },
  { internal_field: 'pricingcategory', source_column: 'PricingCategory' },
  { internal_field: 'pricingunit', source_column: 'PricingUnit' },
  { internal_field: 'resourceid', source_column: 'ResourceId' },
  { internal_field: 'resourcename', source_column: 'ResourceName' },
  { internal_field: 'resourcetype', source_column: 'ResourceType' },
  { internal_field: 'subaccountid', source_column: 'SubAccountId' },
  { internal_field: 'sub_account_name', source_column: 'SubAccountName' },
  { internal_field: 'commitmentdiscountid', source_column: 'CommitmentDiscountId' },
  { internal_field: 'commitmentdiscountname', source_column: 'CommitmentDiscountName' },
  { internal_field: 'commitmentdiscountcategory', source_column: 'CommitmentDiscountCategory' },
  { internal_field: 'commitmentdiscounttype', source_column: 'CommitmentDiscountType' },
  { internal_field: 'commitmentdiscountstatus', source_column: 'CommitmentDiscountStatus' },
  { internal_field: 'id', source_column: 'Id' },
  { internal_field: 'chargecategory', source_column: 'ChargeCategory' },
  { internal_field: 'chargeclass', source_column: 'ChargeClass' },
  { internal_field: 'chargedescription', source_column: 'ChargeDescription' },
  { internal_field: 'chargefrequency', source_column: 'ChargeFrequency' },
  { internal_field: 'billingperiodstart', source_column: 'BillingPeriodStart' },
  { internal_field: 'billingperiodend', source_column: 'BillingPeriodEnd' },
  { internal_field: 'chargeperiodstart', source_column: 'ChargePeriodStart' },
  { internal_field: 'chargeperiodend', source_column: 'ChargePeriodEnd' },
  { internal_field: 'consumedquantity', source_column: 'ConsumedQuantity' },
  { internal_field: 'consumedunit', source_column: 'ConsumedUnit' },
  { internal_field: 'pricingquantity', source_column: 'PricingQuantity' },
  { internal_field: 'pricingunit', source_column: 'PricingUnit' },
  { internal_field: 'listunitprice', source_column: 'ListUnitPrice' },
  { internal_field: 'contractedunitprice', source_column: 'ContractedUnitPrice' },
  { internal_field: 'listcost', source_column: 'ListCost' },
  { internal_field: 'contractedcost', source_column: 'ContractedCost' },
  { internal_field: 'effectivecost', source_column: 'EffectiveCost' },
  { internal_field: 'billedcost', source_column: 'BilledCost' },
  { internal_field: 'tags', source_column: 'Tags' },
];

function normalizeHeader(h) {
  return h?.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

