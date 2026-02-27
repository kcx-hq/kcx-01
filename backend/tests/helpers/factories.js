import {
  BillingColumnMapping,
  BillingDetectedColumn,
  BillingUpload,
  BillingUsageFact,
  ChatMessage,
  ChatSession,
  Client,
  CloudAccount,
  CommitmentDiscount,
  ClientS3Integrations,
  Inquiry,
  MappingSuggestion,
  Region,
  Resource,
  Service,
  Sku,
  SubAccount,
  User,
} from "../../src/models/index.js";

const DEFAULT_DATE = new Date("2026-01-01T00:00:00.000Z");
let sequence = 1;

function nextUuid() {
  const hex = sequence.toString(16).padStart(12, "0");
  sequence += 1;
  return `00000000-0000-4000-8000-${hex}`;
}

function withDefaults(overrides, defaults) {
  return { ...defaults, ...overrides };
}

export function resetFactoryState() {
  sequence = 1;
}

export function deterministicUuid() {
  return nextUuid();
}

export async function createClientFixture(overrides = {}) {
  return Client.create(
    withDefaults(overrides, {
      id: nextUuid(),
      name: "Test Client",
      email: `client-${sequence}@example.test`,
      is_active: true,
    }),
  );
}

export async function createUserFixture(overrides = {}) {
  const client =
    overrides.client_id || (await createClientFixture()).id;

  return User.create(
    withDefaults(overrides, {
      id: nextUuid(),
      client_id: client,
      full_name: "Test User",
      email: `user-${sequence}@example.test`,
      password_hash: "P@ssword123",
      role: "USER",
      is_active: true,
      is_verified: false,
      verification_otp: "123456",
      verification_otp_expires: new Date("2030-01-01T00:00:00.000Z"),
    }),
  );
}

export async function createInquiryFixture(overrides = {}) {
  return Inquiry.create(
    withDefaults(overrides, {
      id: nextUuid(),
      name: "Inquiry User",
      email: `inquiry-${sequence}@example.test`,
      message: "Need help with cloud optimization",
      preferred_datetime: new Date("2026-04-01T09:00:00.000Z"),
      timezone: "UTC",
      status: "PENDING",
      action_token: `token-${sequence}`,
    }),
  );
}

export async function createChatSessionFixture(overrides = {}) {
  return ChatSession.create(
    withDefaults(overrides, {
      id: nextUuid(),
      client_id: null,
      step_index: 0,
      status: "active",
      requirements: {},
    }),
  );
}

export async function createChatMessageFixture(overrides = {}) {
  const sessionId =
    overrides.session_id || (await createChatSessionFixture()).id;

  return ChatMessage.create(
    withDefaults(overrides, {
      id: nextUuid(),
      session_id: sessionId,
      sender: "user",
      message: "hello",
    }),
  );
}

export async function createBillingUploadFixture(overrides = {}) {
  const user = overrides.uploadedby || (await createUserFixture()).id;
  const client = overrides.clientid || (await createClientFixture()).id;

  return BillingUpload.create(
    withDefaults(overrides, {
      uploadid: nextUuid(),
      clientid: client,
      uploadedby: user,
      filename: `upload-${sequence}.csv`,
      filesize: 1024,
      billingperiodstart: "2026-01-01",
      billingperiodend: "2026-01-31",
      checksum: `checksum-${sequence}`,
      uploadedat: DEFAULT_DATE,
      status: "PENDING",
    }),
  );
}

export async function createCloudAccountFixture(overrides = {}) {
  return CloudAccount.create(
    withDefaults(overrides, {
      id: nextUuid(),
      providername: "aws",
      billingaccountid: `acct-${sequence}`,
      billingaccountname: "AWS Payer",
      billingcurrency: "USD",
    }),
  );
}

export async function createServiceFixture(overrides = {}) {
  return Service.create(
    withDefaults(overrides, {
      serviceid: nextUuid(),
      providername: "aws",
      servicename: `AmazonEC2-${sequence}`,
      servicecategory: "Compute",
    }),
  );
}

export async function createRegionFixture(overrides = {}) {
  return Region.create(
    withDefaults(overrides, {
      id: nextUuid(),
      providername: "aws",
      regioncode: `us-east-${(sequence % 3) + 1}`,
      regionname: "US East",
      availabilityzone: "us-east-1a",
    }),
  );
}

export async function createSkuFixture(overrides = {}) {
  return Sku.create(
    withDefaults(overrides, {
      skuid: `sku-${sequence}`,
      skupriceid: `price-${sequence}`,
      pricingcategory: "OnDemand",
      pricingunit: "Hours",
    }),
  );
}

export async function createResourceFixture(overrides = {}) {
  return Resource.create(
    withDefaults(overrides, {
      resourceid: `resource-${sequence}`,
      resourcename: "app-instance",
      resourcetype: "ec2:instance",
    }),
  );
}

export async function createSubAccountFixture(overrides = {}) {
  return SubAccount.create(
    withDefaults(overrides, {
      subaccountid: `sub-${sequence}`,
      subaccountname: "Engineering",
    }),
  );
}

export async function createCommitmentDiscountFixture(overrides = {}) {
  return CommitmentDiscount.create(
    withDefaults(overrides, {
      commitmentdiscountid: `cd-${sequence}`,
      commitmentdiscountname: "Savings Plan",
      commitmentdiscountcategory: "SavingsPlan",
      commitmentdiscounttype: "Compute",
      commitmentdiscountstatus: "Active",
    }),
  );
}

export async function createBillingUsageFactFixture(overrides = {}) {
  const uploadid = overrides.uploadid || (await createBillingUploadFixture()).uploadid;
  const cloudaccountid = overrides.cloudaccountid || (await createCloudAccountFixture()).id;
  const serviceid = overrides.serviceid || (await createServiceFixture()).serviceid;
  const regionid = overrides.regionid || (await createRegionFixture()).id;
  const skuid = overrides.skuid || (await createSkuFixture()).skuid;
  const resourceid = overrides.resourceid || (await createResourceFixture()).resourceid;
  const subaccountid = overrides.subaccountid || (await createSubAccountFixture()).subaccountid;
  const commitmentdiscountid =
    overrides.commitmentdiscountid ||
    (await createCommitmentDiscountFixture()).commitmentdiscountid;

  return BillingUsageFact.create(
    withDefaults(overrides, {
      id: nextUuid(),
      uploadid,
      cloudaccountid,
      serviceid,
      regionid,
      skuid,
      resourceid,
      subaccountid,
      commitmentdiscountid,
      chargecategory: "Usage",
      chargeclass: "OnDemand",
      chargedescription: "Compute hours",
      chargefrequency: "Hourly",
      consumedquantity: 10,
      consumedunit: "Hours",
      pricingquantity: 10,
      pricingunit: "Hours",
      listunitprice: 1.25,
      contractedunitprice: 1.1,
      listcost: 12.5,
      contractedcost: 11,
      effectivecost: 11,
      billedcost: 11,
      billingperiodstart: "2026-01-01",
      billingperiodend: "2026-01-31",
      chargeperiodstart: new Date("2026-01-01T00:00:00.000Z"),
      chargeperiodend: new Date("2026-01-01T23:59:59.000Z"),
      tags: { env: "test" },
      createdat: DEFAULT_DATE,
    }),
  );
}

export async function createClientS3IntegrationFixture(overrides = {}) {
  const clientid = overrides.clientid || (await createClientFixture()).id;
  return ClientS3Integrations.create(
    withDefaults(overrides, {
      id: nextUuid(),
      clientid,
      region: "ap-south-1",
      bucket: `bucket-${sequence}`,
      prefix: "billing/",
      rolearn: "arn:aws:iam::123456789012:role/test-role",
      externalid: "ext-test",
      enabled: true,
      lastpolledat: null,
      lasterror: null,
      createdat: DEFAULT_DATE,
      updatedat: DEFAULT_DATE,
    }),
  );
}

export async function createBillingColumnMappingFixture(overrides = {}) {
  const clientid = overrides.clientid || (await createClientFixture()).id;
  return BillingColumnMapping.create(
    withDefaults(overrides, {
      id: nextUuid(),
      clientid,
      provider: "aws",
      internal_field: "providername",
      source_column: "Provider Name",
      priority: 1,
    }),
  );
}

export async function createBillingDetectedColumnFixture(overrides = {}) {
  const clientid = overrides.clientid || (await createClientFixture()).id;
  return BillingDetectedColumn.create(
    withDefaults(overrides, {
      id: nextUuid(),
      clientid,
      provider: "aws",
      column_name: "providername",
      first_seen: DEFAULT_DATE,
    }),
  );
}

export async function createMappingSuggestionFixture(overrides = {}) {
  const uploadid = overrides.uploadid || (await createBillingUploadFixture()).uploadid;
  const clientid = overrides.clientid || (await createClientFixture()).id;
  return MappingSuggestion.create(
    withDefaults(overrides, {
      id: nextUuid(),
      uploadid,
      provider: "aws",
      source_column: "providername",
      internal_field: "providername",
      score: 0.99,
      automapped: true,
      clientid,
      reasons: { reason: "exact_match" },
    }),
  );
}
