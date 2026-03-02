
'use strict';

module.exports = {
up: async (queryInterface, Sequelize) => {
const transaction = await queryInterface.sequelize.transaction();

try {
  await queryInterface.sequelize.query(
    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
         CREATE TYPE "enum_users_role" AS ENUM ('ADMIN', 'USER');
       END IF;
     END$$;`,
    { transaction }
  );

  await queryInterface.sequelize.query(
    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_inquiries_status') THEN
         CREATE TYPE "enum_inquiries_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'STANDBY', 'HANDLED', 'TRASHED');
       END IF;
     END$$;`,
    { transaction }
  );

  await queryInterface.sequelize.query(
    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_inquiries_relay_severity') THEN
         CREATE TYPE "enum_inquiries_relay_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
       END IF;
     END$$;`,
    { transaction }
  );

  await queryInterface.sequelize.query(
    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_billing_uploads_status') THEN
         CREATE TYPE "enum_billing_uploads_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
       END IF;
     END$$;`,
    { transaction }
  );

  await queryInterface.sequelize.query(
    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_chat_sessions_status') THEN
         CREATE TYPE "enum_chat_sessions_status" AS ENUM ('active', 'completed', 'abandoned');
       END IF;
     END$$;`,
    { transaction }
  );

  await queryInterface.sequelize.query(
    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_chat_messages_sender') THEN
         CREATE TYPE "enum_chat_messages_sender" AS ENUM ('user', 'bot');
       END IF;
     END$$;`,
    { transaction }
  );

  await queryInterface.createTable(
    'clients',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'users',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: 'enum_users_role',
        allowNull: true,
        defaultValue: null
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_premium: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verification_otp: {
        type: Sequelize.STRING,
        allowNull: true
      },
      verification_otp_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resetPasswordTokenHash: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      },
      resetPasswordExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'kcx_admins',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'login_attempts',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ip: {
        type: Sequelize.STRING,
        allowNull: false
      },
      failed_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      first_failed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_failed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      blocked_until: {
        type: Sequelize.DATE,
        allowNull: true
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'inquiries',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: 'enum_inquiries_status',
        allowNull: false,
        defaultValue: 'PENDING'
      },
      meet_link: {
        type: Sequelize.STRING,
        allowNull: true
      },
      preferred_datetime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      timezone: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Asia/Kolkata'
      },
      action_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      boss_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      boss_token_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      relay_severity: {
        type: 'enum_inquiries_relay_severity',
        allowNull: true
      },
      relay_note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      relayed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      trashed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      activity_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'admin_activity_logs',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      admin_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      correlation_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'client_activity_logs',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      actor_user_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      actor_kind: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'SYSTEM'
      },
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      correlation_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'cloud_accounts',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      providername: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      billingaccountid: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      billingaccountname: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      billingcurrency: {
        type: Sequelize.STRING(3),
        allowNull: true
      },
      invoiceissuername: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      publishername: {
        type: Sequelize.STRING(128),
        allowNull: true
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'regions',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      providername: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      regioncode: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      regionname: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      availabilityzone: {
        type: Sequelize.STRING(50),
        allowNull: true
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'resources',
    {
      resourceid: {
        type: Sequelize.STRING(512),
        allowNull: false
      },
      resourcename: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      resourcetype: {
        type: Sequelize.STRING(64),
        allowNull: true
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'services',
    {
      serviceid: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      providername: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      servicename: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      servicecategory: {
        type: Sequelize.STRING(50),
        allowNull: true
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'skus',
    {
      skuid: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      skupriceid: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      pricingcategory: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      pricingunit: {
        type: Sequelize.STRING(128),
        allowNull: true
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'sub_accounts',
    {
      subaccountid: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      subaccountname: {
        type: Sequelize.STRING(128),
        allowNull: true
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'commitment_discounts',
    {
      commitmentdiscountid: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      commitmentdiscountname: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      commitmentdiscountcategory: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      commitmentdiscounttype: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      commitmentdiscountstatus: {
        type: Sequelize.STRING(30),
        allowNull: true
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'billing_uploads',
    {
      uploadid: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      clientid: {
        type: Sequelize.UUID,
        allowNull: false
      },
      uploadedby: {
        type: Sequelize.UUID,
        allowNull: false
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false
      },
      filesize: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      billingperiodstart: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      billingperiodend: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      checksum: {
        type: Sequelize.STRING,
        allowNull: false
      },
      uploadedat: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      status: {
        type: 'enum_billing_uploads_status',
        allowNull: false,
        defaultValue: 'PENDING'
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'billing_usage_fact',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      uploadid: {
        type: Sequelize.UUID,
        allowNull: false
      },
      cloudaccountid: {
        type: Sequelize.UUID,
        allowNull: false
      },
      serviceid: {
        type: Sequelize.UUID,
        allowNull: false
      },
      regionid: {
        type: Sequelize.UUID,
        allowNull: false
      },
      skuid: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      resourceid: {
        type: Sequelize.STRING(512),
        allowNull: true
      },
      subaccountid: {
        type: Sequelize.STRING(614),
        allowNull: true
      },
      commitmentdiscountid: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      chargecategory: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      chargeclass: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      chargedescription: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      chargefrequency: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      consumedquantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      consumedunit: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      pricingquantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      pricingunit: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      listunitprice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      contractedunitprice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      listcost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      contractedcost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      effectivecost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      billedcost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      billingperiodstart: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      billingperiodend: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      chargeperiodstart: {
        type: Sequelize.DATE,
        allowNull: true
      },
      chargeperiodend: {
        type: Sequelize.DATE,
        allowNull: true
      },
      tags: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      createdat: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'billing_column_mappings',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      clientid: {
        type: Sequelize.UUID,
        allowNull: false
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false
      },
      internal_field: {
        type: Sequelize.STRING,
        allowNull: false
      },
      source_column: {
        type: Sequelize.STRING,
        allowNull: false
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'billing_detected_columns',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      clientid: {
        type: Sequelize.UUID,
        allowNull: false
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false
      },
      column_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      first_seen: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'mapping_suggestions',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      uploadid: {
        type: Sequelize.UUID,
        allowNull: false
      },
      provider: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      source_column: {
        type: Sequelize.STRING,
        allowNull: false
      },
      internal_field: {
        type: Sequelize.STRING,
        allowNull: false
      },
      score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      detectedtype: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      reasons: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      automapped: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      clientid: {
        type: Sequelize.UUID,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'suggested'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'raw_aws_billing_rows',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      source_s3_key: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      row_data: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      ingested_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'client_s3_integrations',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      clientid: {
        type: Sequelize.UUID,
        allowNull: false
      },
      region: {
        type: Sequelize.STRING,
        defaultValue: 'ap-south-1'
      },
      bucket: {
        type: Sequelize.STRING,
        allowNull: false
      },
      prefix: {
        type: Sequelize.STRING,
        allowNull: true
      },
      rolearn: {
        type: Sequelize.STRING,
        allowNull: false
      },
      externalid: {
        type: Sequelize.STRING,
        allowNull: true
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lastpolledat: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lasterror: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdat: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedat: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'cloud_account_credentials',
    {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true
      },
      clientid: {
        type: Sequelize.UUID,
        allowNull: false
      },
      accountid: {
        type: Sequelize.STRING,
        allowNull: false
      },
      accesskey: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      secretaccesskey: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      region: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'chat_sessions',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      step_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: 'enum_chat_sessions_status',
        allowNull: false,
        defaultValue: 'active'
      },
      requirements: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '{}'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    },
    { transaction }
  );

  await queryInterface.createTable(
    'chat_messages',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      sender: {
        type: 'enum_chat_messages_sender',
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    },
    { transaction }
  );

  await queryInterface.addConstraint('clients', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_clients',
    transaction
  });
  await queryInterface.addConstraint('users', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_users',
    transaction
  });
  await queryInterface.addConstraint('kcx_admins', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_kcx_admins',
    transaction
  });
  await queryInterface.addConstraint('login_attempts', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_login_attempts',
    transaction
  });
  await queryInterface.addConstraint('inquiries', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_inquiries',
    transaction
  });
  await queryInterface.addConstraint('admin_activity_logs', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_admin_activity_logs',
    transaction
  });
  await queryInterface.addConstraint('client_activity_logs', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_client_activity_logs',
    transaction
  });
  await queryInterface.addConstraint('cloud_accounts', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_cloud_accounts',
    transaction
  });
  await queryInterface.addConstraint('regions', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_regions',
    transaction
  });
  await queryInterface.addConstraint('resources', {
    fields: ['resourceid'],
    type: 'primary key',
    name: 'pk_resources',
    transaction
  });
  await queryInterface.addConstraint('services', {
    fields: ['serviceid'],
    type: 'primary key',
    name: 'pk_services',
    transaction
  });
  await queryInterface.addConstraint('skus', {
    fields: ['skuid'],
    type: 'primary key',
    name: 'pk_skus',
    transaction
  });
  await queryInterface.addConstraint('sub_accounts', {
    fields: ['subaccountid'],
    type: 'primary key',
    name: 'pk_sub_accounts',
    transaction
  });
  await queryInterface.addConstraint('commitment_discounts', {
    fields: ['commitmentdiscountid'],
    type: 'primary key',
    name: 'pk_commitment_discounts',
    transaction
  });
  await queryInterface.addConstraint('billing_uploads', {
    fields: ['uploadid'],
    type: 'primary key',
    name: 'pk_billing_uploads',
    transaction
  });
  await queryInterface.addConstraint('billing_usage_fact', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_billing_usage_fact',
    transaction
  });
  await queryInterface.addConstraint('billing_column_mappings', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_billing_column_mappings',
    transaction
  });
  await queryInterface.addConstraint('billing_detected_columns', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_billing_detected_columns',
    transaction
  });
  await queryInterface.addConstraint('mapping_suggestions', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_mapping_suggestions',
    transaction
  });
  await queryInterface.addConstraint('raw_aws_billing_rows', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_raw_aws_billing_rows',
    transaction
  });
  await queryInterface.addConstraint('client_s3_integrations', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_client_s3_integrations',
    transaction
  });
  await queryInterface.addConstraint('cloud_account_credentials', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_cloud_account_credentials',
    transaction
  });
  await queryInterface.addConstraint('chat_sessions', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_chat_sessions',
    transaction
  });
  await queryInterface.addConstraint('chat_messages', {
    fields: ['id'],
    type: 'primary key',
    name: 'pk_chat_messages',
    transaction
  });

  await queryInterface.addConstraint('users', {
    fields: ['email'],
    type: 'unique',
    name: 'uq_users_email',
    transaction
  });
  await queryInterface.addConstraint('kcx_admins', {
    fields: ['email'],
    type: 'unique',
    name: 'uq_kcx_admins_email',
    transaction
  });
  await queryInterface.addConstraint('login_attempts', {
    fields: ['email', 'ip'],
    type: 'unique',
    name: 'uq_login_attempts_email_ip',
    transaction
  });
  await queryInterface.addConstraint('cloud_accounts', {
    fields: ['providername', 'billingaccountid'],
    type: 'unique',
    name: 'uq_cloud_accounts_providername_billingaccountid',
    transaction
  });
  await queryInterface.addConstraint('regions', {
    fields: ['providername', 'regioncode'],
    type: 'unique',
    name: 'uq_regions_providername_regioncode',
    transaction
  });
  await queryInterface.addConstraint('services', {
    fields: ['providername', 'servicename'],
    type: 'unique',
    name: 'uq_services_providername_servicename',
    transaction
  });
  await queryInterface.addConstraint('cloud_account_credentials', {
    fields: ['clientid', 'accountid'],
    type: 'unique',
    name: 'uq_cloud_account_credentials_clientid_accountid',
    transaction
  });
  await queryInterface.addConstraint('billing_column_mappings', {
    fields: ['clientid', 'provider', 'internal_field', 'source_column'],
    type: 'unique',
    name: 'uq_billing_column_mappings_client_provider_internal_source',
    transaction
  });
  await queryInterface.addConstraint('billing_detected_columns', {
    fields: ['clientid', 'provider', 'column_name'],
    type: 'unique',
    name: 'uq_billing_detected_columns_client_provider_column',
    transaction
  });
  await queryInterface.addConstraint('mapping_suggestions', {
    fields: ['clientid', 'source_column', 'internal_field'],
    type: 'unique',
    name: 'uq_mapping_suggestions_client_source_internal',
    transaction
  });

  await queryInterface.addConstraint('users', {
    fields: ['client_id'],
    type: 'foreign key',
    name: 'fk_users_client_id_clients',
    references: {
      table: 'clients',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    transaction
  });

  await queryInterface.addConstraint('client_s3_integrations', {
    fields: ['clientid'],
    type: 'foreign key',
    name: 'fk_client_s3_integrations_clientid_clients',
    references: {
      table: 'clients',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    transaction
  });

  await queryInterface.addConstraint('cloud_account_credentials', {
    fields: ['clientid'],
    type: 'foreign key',
    name: 'fk_cloud_account_credentials_clientid_clients',
    references: {
      table: 'clients',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    transaction
  });

  await queryInterface.addConstraint('billing_column_mappings', {
    fields: ['clientid'],
    type: 'foreign key',
    name: 'fk_billing_column_mappings_clientid_clients',
    references: {
      table: 'clients',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    transaction
  });

  await queryInterface.addConstraint('billing_detected_columns', {
    fields: ['clientid'],
    type: 'foreign key',
    name: 'fk_billing_detected_columns_clientid_clients',
    references: {
      table: 'clients',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    transaction
  });

  await queryInterface.addConstraint('mapping_suggestions', {
    fields: ['clientid'],
    type: 'foreign key',
    name: 'fk_mapping_suggestions_clientid_clients',
    references: {
      table: 'clients',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    transaction
  });

  await queryInterface.addConstraint('billing_uploads', {
    fields: ['clientid'],
    type: 'foreign key',
    name: 'fk_billing_uploads_clientid_clients',
    references: {
      table: 'clients',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    transaction
  });

  await queryInterface.addConstraint('billing_uploads', {
    fields: ['uploadedby'],
    type: 'foreign key',
    name: 'fk_billing_uploads_uploadedby_users',
    references: {
      table: 'users',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    transaction
  });

  await queryInterface.addConstraint('billing_usage_fact', {
    fields: ['uploadid'],
    type: 'foreign key',
    name: 'fk_billing_usage_fact_uploadid_billing_uploads',
    references: {
      table: 'billing_uploads',
      field: 'uploadid'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    transaction
  });

  await queryInterface.addConstraint('billing_usage_fact', {
    fields: ['cloudaccountid'],
    type: 'foreign key',
    name: 'fk_billing_usage_fact_cloudaccountid_cloud_accounts',
    references: {
      table: 'cloud_accounts',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    transaction
  });

  await queryInterface.addConstraint('billing_usage_fact', {
    fields: ['serviceid'],
    type: 'foreign key',
    name: 'fk_billing_usage_fact_serviceid_services',
    references: {
      table: 'services',
      field: 'serviceid'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    transaction
  });

  await queryInterface.addConstraint('billing_usage_fact', {
    fields: ['skuid'],
    type: 'foreign key',
    name: 'fk_billing_usage_fact_skuid_skus',
    references: {
      table: 'skus',
      field: 'skuid'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    transaction
  });

  await queryInterface.addConstraint('billing_usage_fact', {
    fields: ['resourceid'],
    type: 'foreign key',
    name: 'fk_billing_usage_fact_resourceid_resources',
    references: {
      table: 'resources',
      field: 'resourceid'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    transaction
  });

  await queryInterface.addConstraint('billing_usage_fact', {
    fields: ['regionid'],
    type: 'foreign key',
    name: 'fk_billing_usage_fact_regionid_regions',
    references: {
      table: 'regions',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    transaction
  });

  await queryInterface.addConstraint('billing_usage_fact', {
    fields: ['subaccountid'],
    type: 'foreign key',
    name: 'fk_billing_usage_fact_subaccountid_sub_accounts',
    references: {
      table: 'sub_accounts',
      field: 'subaccountid'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    transaction
  });

  await queryInterface.addConstraint('billing_usage_fact', {
    fields: ['commitmentdiscountid'],
    type: 'foreign key',
    name: 'fk_billing_usage_fact_commitmentdiscountid_commitment_discs',
    references: {
      table: 'commitment_discounts',
      field: 'commitmentdiscountid'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    transaction
  });

  await queryInterface.addConstraint('chat_sessions', {
    fields: ['client_id'],
    type: 'foreign key',
    name: 'fk_chat_sessions_client_id_clients',
    references: {
      table: 'clients',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    transaction
  });

  await queryInterface.addConstraint('chat_messages', {
    fields: ['session_id'],
    type: 'foreign key',
    name: 'fk_chat_messages_session_id_chat_sessions',
    references: {
      table: 'chat_sessions',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    transaction
  });

  await queryInterface.addIndex('users', ['client_id'], {
    name: 'idx_users_client_id',
    transaction
  });

  await queryInterface.addIndex('login_attempts', ['blocked_until'], {
    name: 'idx_login_attempts_blocked_until',
    transaction
  });

  await queryInterface.addIndex('login_attempts', ['last_failed_at'], {
    name: 'idx_login_attempts_last_failed_at',
    transaction
  });

  await queryInterface.addIndex('regions', ['availabilityzone'], {
    name: 'idx_regions_availabilityzone',
    transaction
  });

  await queryInterface.addIndex('resources', ['resourcetype'], {
    name: 'idx_resources_resourcetype',
    transaction
  });

  await queryInterface.addIndex('services', ['servicecategory'], {
    name: 'idx_services_servicecategory',
    transaction
  });

  await queryInterface.addIndex('skus', ['pricingcategory'], {
    name: 'idx_skus_pricingcategory',
    transaction
  });

  await queryInterface.addIndex('skus', ['pricingunit'], {
    name: 'idx_skus_pricingunit',
    transaction
  });

  await queryInterface.addIndex('sub_accounts', ['subaccountname'], {
    name: 'idx_sub_accounts_subaccountname',
    transaction
  });

  await queryInterface.addIndex('commitment_discounts', ['commitmentdiscountcategory'], {
    name: 'idx_commitment_discounts_commitmentdiscountcategory',
    transaction
  });

  await queryInterface.addIndex('commitment_discounts', ['commitmentdiscountstatus'], {
    name: 'idx_commitment_discounts_commitmentdiscountstatus',
    transaction
  });

  await queryInterface.addIndex('billing_uploads', ['clientid'], {
    name: 'idx_billing_uploads_clientid',
    transaction
  });

  await queryInterface.addIndex('billing_uploads', ['uploadedby'], {
    name: 'idx_billing_uploads_uploadedby',
    transaction
  });

  await queryInterface.addIndex('billing_usage_fact', ['uploadid'], {
    name: 'idx_billing_usage_fact_uploadid',
    transaction
  });

  await queryInterface.addIndex('billing_usage_fact', ['chargeperiodstart'], {
    name: 'idx_billing_usage_fact_chargeperiodstart',
    transaction
  });

  await queryInterface.addIndex('billing_usage_fact', ['billedcost'], {
    name: 'idx_billing_usage_fact_billedcost',
    transaction
  });

  await queryInterface.addIndex('billing_usage_fact', ['uploadid', 'chargeperiodstart'], {
    name: 'idx_billing_usage_fact_uploadid_chargeperiodstart',
    transaction
  });

  await queryInterface.addIndex('billing_usage_fact', ['cloudaccountid'], {
    name: 'idx_billing_usage_fact_cloudaccountid',
    transaction
  });

  await queryInterface.addIndex('billing_usage_fact', ['serviceid'], {
    name: 'idx_billing_usage_fact_serviceid',
    transaction
  });

  await queryInterface.addIndex('billing_usage_fact', ['regionid'], {
    name: 'idx_billing_usage_fact_regionid',
    transaction
  });

  await queryInterface.addIndex('billing_usage_fact', ['resourceid'], {
    name: 'idx_billing_usage_fact_resourceid',
    transaction
  });

  await queryInterface.addIndex('billing_usage_fact', ['skuid'], {
    name: 'idx_billing_usage_fact_skuid',
    transaction
  });

  await queryInterface.addIndex('billing_usage_fact', ['subaccountid'], {
    name: 'idx_billing_usage_fact_subaccountid',
    transaction
  });

  await queryInterface.addIndex('billing_usage_fact', ['commitmentdiscountid'], {
    name: 'idx_billing_usage_fact_commitmentdiscountid',
    transaction
  });

  await queryInterface.addIndex('billing_column_mappings', ['clientid'], {
    name: 'idx_billing_column_mappings_clientid',
    transaction
  });

  await queryInterface.addIndex('billing_detected_columns', ['clientid'], {
    name: 'idx_billing_detected_columns_clientid',
    transaction
  });

  await queryInterface.addIndex('mapping_suggestions', ['clientid'], {
    name: 'idx_mapping_suggestions_clientid',
    transaction
  });

  await queryInterface.addIndex('raw_aws_billing_rows', ['ingested_at'], {
    name: 'idx_raw_aws_billing_rows_ingested_at',
    transaction
  });

  await queryInterface.addIndex('raw_aws_billing_rows', ['source_s3_key'], {
    name: 'idx_raw_aws_billing_rows_source_s3_key',
    transaction
  });

  await queryInterface.addIndex('client_s3_integrations', ['clientid'], {
    name: 'idx_client_s3_integrations_clientid',
    transaction
  });

  await queryInterface.addIndex('cloud_account_credentials', ['clientid'], {
    name: 'idx_cloud_account_credentials_clientid',
    transaction
  });

  await queryInterface.addIndex('chat_sessions', ['status'], {
    name: 'idx_chat_sessions_status',
    transaction
  });

  await queryInterface.addIndex('chat_sessions', ['created_at'], {
    name: 'idx_chat_sessions_created_at',
    transaction
  });

  await queryInterface.addIndex('chat_sessions', ['client_id'], {
    name: 'idx_chat_sessions_client_id',
    transaction
  });

  await queryInterface.addIndex('chat_messages', ['session_id'], {
    name: 'idx_chat_messages_session_id',
    transaction
  });

  await queryInterface.addIndex('chat_messages', ['created_at'], {
    name: 'idx_chat_messages_created_at',
    transaction
  });

  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
},

down: async (queryInterface) => {
const transaction = await queryInterface.sequelize.transaction();

try {
  await queryInterface.removeConstraint('chat_messages', 'fk_chat_messages_session_id_chat_sessions', { transaction });
  await queryInterface.removeConstraint('chat_sessions', 'fk_chat_sessions_client_id_clients', { transaction });
  await queryInterface.removeConstraint('billing_usage_fact', 'fk_billing_usage_fact_commitmentdiscountid_commitment_discs', { transaction });
  await queryInterface.removeConstraint('billing_usage_fact', 'fk_billing_usage_fact_subaccountid_sub_accounts', { transaction });
  await queryInterface.removeConstraint('billing_usage_fact', 'fk_billing_usage_fact_regionid_regions', { transaction });
  await queryInterface.removeConstraint('billing_usage_fact', 'fk_billing_usage_fact_resourceid_resources', { transaction });
  await queryInterface.removeConstraint('billing_usage_fact', 'fk_billing_usage_fact_skuid_skus', { transaction });
  await queryInterface.removeConstraint('billing_usage_fact', 'fk_billing_usage_fact_serviceid_services', { transaction });
  await queryInterface.removeConstraint('billing_usage_fact', 'fk_billing_usage_fact_cloudaccountid_cloud_accounts', { transaction });
  await queryInterface.removeConstraint('billing_usage_fact', 'fk_billing_usage_fact_uploadid_billing_uploads', { transaction });
  await queryInterface.removeConstraint('billing_uploads', 'fk_billing_uploads_uploadedby_users', { transaction });
  await queryInterface.removeConstraint('billing_uploads', 'fk_billing_uploads_clientid_clients', { transaction });
  await queryInterface.removeConstraint('mapping_suggestions', 'fk_mapping_suggestions_clientid_clients', { transaction });
  await queryInterface.removeConstraint('billing_detected_columns', 'fk_billing_detected_columns_clientid_clients', { transaction });
  await queryInterface.removeConstraint('billing_column_mappings', 'fk_billing_column_mappings_clientid_clients', { transaction });
  await queryInterface.removeConstraint('cloud_account_credentials', 'fk_cloud_account_credentials_clientid_clients', { transaction });
  await queryInterface.removeConstraint('client_s3_integrations', 'fk_client_s3_integrations_clientid_clients', { transaction });
  await queryInterface.removeConstraint('users', 'fk_users_client_id_clients', { transaction });

  await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_created_at', { transaction });
  await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_session_id', { transaction });
  await queryInterface.removeIndex('chat_sessions', 'idx_chat_sessions_client_id', { transaction });
  await queryInterface.removeIndex('chat_sessions', 'idx_chat_sessions_created_at', { transaction });
  await queryInterface.removeIndex('chat_sessions', 'idx_chat_sessions_status', { transaction });
  await queryInterface.removeIndex('cloud_account_credentials', 'idx_cloud_account_credentials_clientid', { transaction });
  await queryInterface.removeIndex('client_s3_integrations', 'idx_client_s3_integrations_clientid', { transaction });
  await queryInterface.removeIndex('raw_aws_billing_rows', 'idx_raw_aws_billing_rows_source_s3_key', { transaction });
  await queryInterface.removeIndex('raw_aws_billing_rows', 'idx_raw_aws_billing_rows_ingested_at', { transaction });
  await queryInterface.removeIndex('mapping_suggestions', 'idx_mapping_suggestions_clientid', { transaction });
  await queryInterface.removeIndex('billing_detected_columns', 'idx_billing_detected_columns_clientid', { transaction });
  await queryInterface.removeIndex('billing_column_mappings', 'idx_billing_column_mappings_clientid', { transaction });
  await queryInterface.removeIndex('billing_usage_fact', 'idx_billing_usage_fact_commitmentdiscountid', { transaction });
  await queryInterface.removeIndex('billing_usage_fact', 'idx_billing_usage_fact_subaccountid', { transaction });
  await queryInterface.removeIndex('billing_usage_fact', 'idx_billing_usage_fact_skuid', { transaction });
  await queryInterface.removeIndex('billing_usage_fact', 'idx_billing_usage_fact_resourceid', { transaction });
  await queryInterface.removeIndex('billing_usage_fact', 'idx_billing_usage_fact_regionid', { transaction });
  await queryInterface.removeIndex('billing_usage_fact', 'idx_billing_usage_fact_serviceid', { transaction });
  await queryInterface.removeIndex('billing_usage_fact', 'idx_billing_usage_fact_cloudaccountid', { transaction });
  await queryInterface.removeIndex('billing_usage_fact', 'idx_billing_usage_fact_uploadid_chargeperiodstart', { transaction });
  await queryInterface.removeIndex('billing_usage_fact', 'idx_billing_usage_fact_billedcost', { transaction });
  await queryInterface.removeIndex('billing_usage_fact', 'idx_billing_usage_fact_chargeperiodstart', { transaction });
  await queryInterface.removeIndex('billing_usage_fact', 'idx_billing_usage_fact_uploadid', { transaction });
  await queryInterface.removeIndex('billing_uploads', 'idx_billing_uploads_uploadedby', { transaction });
  await queryInterface.removeIndex('billing_uploads', 'idx_billing_uploads_clientid', { transaction });
  await queryInterface.removeIndex('commitment_discounts', 'idx_commitment_discounts_commitmentdiscountstatus', { transaction });
  await queryInterface.removeIndex('commitment_discounts', 'idx_commitment_discounts_commitmentdiscountcategory', { transaction });
  await queryInterface.removeIndex('sub_accounts', 'idx_sub_accounts_subaccountname', { transaction });
  await queryInterface.removeIndex('skus', 'idx_skus_pricingunit', { transaction });
  await queryInterface.removeIndex('skus', 'idx_skus_pricingcategory', { transaction });
  await queryInterface.removeIndex('services', 'idx_services_servicecategory', { transaction });
  await queryInterface.removeIndex('resources', 'idx_resources_resourcetype', { transaction });
  await queryInterface.removeIndex('regions', 'idx_regions_availabilityzone', { transaction });
  await queryInterface.removeIndex('login_attempts', 'idx_login_attempts_last_failed_at', { transaction });
  await queryInterface.removeIndex('login_attempts', 'idx_login_attempts_blocked_until', { transaction });
  await queryInterface.removeIndex('users', 'idx_users_client_id', { transaction });

  await queryInterface.removeConstraint('mapping_suggestions', 'uq_mapping_suggestions_client_source_internal', { transaction });
  await queryInterface.removeConstraint('billing_detected_columns', 'uq_billing_detected_columns_client_provider_column', { transaction });
  await queryInterface.removeConstraint('billing_column_mappings', 'uq_billing_column_mappings_client_provider_internal_source', { transaction });
  await queryInterface.removeConstraint('cloud_account_credentials', 'uq_cloud_account_credentials_clientid_accountid', { transaction });
  await queryInterface.removeConstraint('services', 'uq_services_providername_servicename', { transaction });
  await queryInterface.removeConstraint('regions', 'uq_regions_providername_regioncode', { transaction });
  await queryInterface.removeConstraint('cloud_accounts', 'uq_cloud_accounts_providername_billingaccountid', { transaction });
  await queryInterface.removeConstraint('login_attempts', 'uq_login_attempts_email_ip', { transaction });
  await queryInterface.removeConstraint('kcx_admins', 'uq_kcx_admins_email', { transaction });
  await queryInterface.removeConstraint('users', 'uq_users_email', { transaction });

  await queryInterface.removeConstraint('chat_messages', 'pk_chat_messages', { transaction });
  await queryInterface.removeConstraint('chat_sessions', 'pk_chat_sessions', { transaction });
  await queryInterface.removeConstraint('cloud_account_credentials', 'pk_cloud_account_credentials', { transaction });
  await queryInterface.removeConstraint('client_s3_integrations', 'pk_client_s3_integrations', { transaction });
  await queryInterface.removeConstraint('raw_aws_billing_rows', 'pk_raw_aws_billing_rows', { transaction });
  await queryInterface.removeConstraint('mapping_suggestions', 'pk_mapping_suggestions', { transaction });
  await queryInterface.removeConstraint('billing_detected_columns', 'pk_billing_detected_columns', { transaction });
  await queryInterface.removeConstraint('billing_column_mappings', 'pk_billing_column_mappings', { transaction });
  await queryInterface.removeConstraint('billing_usage_fact', 'pk_billing_usage_fact', { transaction });
  await queryInterface.removeConstraint('billing_uploads', 'pk_billing_uploads', { transaction });
  await queryInterface.removeConstraint('commitment_discounts', 'pk_commitment_discounts', { transaction });
  await queryInterface.removeConstraint('sub_accounts', 'pk_sub_accounts', { transaction });
  await queryInterface.removeConstraint('skus', 'pk_skus', { transaction });
  await queryInterface.removeConstraint('services', 'pk_services', { transaction });
  await queryInterface.removeConstraint('resources', 'pk_resources', { transaction });
  await queryInterface.removeConstraint('regions', 'pk_regions', { transaction });
  await queryInterface.removeConstraint('cloud_accounts', 'pk_cloud_accounts', { transaction });
  await queryInterface.removeConstraint('client_activity_logs', 'pk_client_activity_logs', { transaction });
  await queryInterface.removeConstraint('admin_activity_logs', 'pk_admin_activity_logs', { transaction });
  await queryInterface.removeConstraint('inquiries', 'pk_inquiries', { transaction });
  await queryInterface.removeConstraint('login_attempts', 'pk_login_attempts', { transaction });
  await queryInterface.removeConstraint('kcx_admins', 'pk_kcx_admins', { transaction });
  await queryInterface.removeConstraint('users', 'pk_users', { transaction });
  await queryInterface.removeConstraint('clients', 'pk_clients', { transaction });

  await queryInterface.dropTable('chat_messages', { transaction });
  await queryInterface.dropTable('chat_sessions', { transaction });
  await queryInterface.dropTable('cloud_account_credentials', { transaction });
  await queryInterface.dropTable('client_s3_integrations', { transaction });
  await queryInterface.dropTable('raw_aws_billing_rows', { transaction });
  await queryInterface.dropTable('mapping_suggestions', { transaction });
  await queryInterface.dropTable('billing_detected_columns', { transaction });
  await queryInterface.dropTable('billing_column_mappings', { transaction });
  await queryInterface.dropTable('billing_usage_fact', { transaction });
  await queryInterface.dropTable('billing_uploads', { transaction });
  await queryInterface.dropTable('commitment_discounts', { transaction });
  await queryInterface.dropTable('sub_accounts', { transaction });
  await queryInterface.dropTable('skus', { transaction });
  await queryInterface.dropTable('services', { transaction });
  await queryInterface.dropTable('resources', { transaction });
  await queryInterface.dropTable('regions', { transaction });
  await queryInterface.dropTable('cloud_accounts', { transaction });
  await queryInterface.dropTable('client_activity_logs', { transaction });
  await queryInterface.dropTable('admin_activity_logs', { transaction });
  await queryInterface.dropTable('inquiries', { transaction });
  await queryInterface.dropTable('login_attempts', { transaction });
  await queryInterface.dropTable('kcx_admins', { transaction });
  await queryInterface.dropTable('users', { transaction });
  await queryInterface.dropTable('clients', { transaction });

  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_chat_messages_sender";', { transaction });
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_chat_sessions_status";', { transaction });
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_billing_uploads_status";', { transaction });
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inquiries_relay_severity";', { transaction });
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inquiries_status";', { transaction });
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";', { transaction });

  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
}
}