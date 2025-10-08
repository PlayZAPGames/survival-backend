<script>
  import Joi from 'joi'

  export let value
  export let onSave

  let stringValue = JSON.stringify(value, null, 2)
  let error = null
  let isSaving = false

  // Enhanced schemas with better error messages
  const schemas = {
    walletWithdraw: Joi.object({
      day_limit: Joi.number()
        .min(0)
        .required()
        .messages({ 'number.base': 'day_limit must be a number' }),
      min_withdraw: Joi.number()
        .min(0)
        .required()
        .messages({ 'number.base': 'min_withdraw must be a number' }),
      processing_fee: Joi.number()
        .min(0)
        .required()
        .messages({ 'number.base': 'processing_fee must be a number' }),
      withdraw_maintenance: Joi.boolean()
        .required()
        .messages({ 'number.base': 'withdraw_maintenance must be a boolean' }),
    })
      .strict()
      .messages({
        'object.unknown': 'Invalid field: {#label}',
        'object.base': 'Must be an object with virtual1 and virtual2',
      }),

    leaderboardRewards: Joi.object({
      rewards: Joi.array()
        .items(
          Joi.object({
            rank: Joi.number().integer().min(1).required().messages({
              'number.base': 'Rank must be a number',
              'number.min': 'Rank must be at least 1',
              'number.integer': 'Rank must be an integer',
              'any.required': 'Rank is required',
            }),
            reward: Joi.number().min(0).required().messages({
              'number.base': 'Reward must be a number',
              'number.min': 'Reward cannot be negative',
              'any.required': 'Reward is required',
            }),
          }).strict(),
        )
        .min(1)
        .unique('rank') // prevent duplicate ranks
        .messages({
          'array.base': 'Rewards must be an array',
          'array.min': 'At least one reward entry is required',
          'array.unique': 'Ranks must be unique',
        }),
    })
      .strict()
      .messages({
        'object.unknown': 'Invalid field: {#label}',
        'object.base': 'Must be an object with rewards array',
      }),

    joinReward: Joi.object({
      virtual1: Joi.number()
        .min(0)
        .required()
        .messages({ 'number.base': 'virtual1 must be a number' }),
      virtual2: Joi.number()
        .min(0)
        .required()
        .messages({ 'number.base': 'virtual2 must be a number' }),
    })
      .strict()
      .messages({
        'object.unknown': 'Invalid field: {#label}',
        'object.base': 'Must be an object with virtual1 and virtual2',
      }),

    referral: Joi.object({
      referrerDailyRewardLimit: Joi.number()
        .min(0)
        .required()
        .messages({ 'number.base': 'referrerDailyRewardLimit must be a number' }),

      virtual1: Joi.object({
        referreeReward: Joi.number()
          .min(0)
          .required()
          .messages({ 'number.base': 'Referree reward must be a number' }),
        referrerReward: Joi.number()
          .min(0)
          .required()
          .messages({ 'number.base': 'Referrer reward must be a number' }),
      })
        .strict()
        .messages({
          'object.unknown': 'Invalid field in virtual1',
          'object.base': 'virtual1 must have referreeReward and referrerReward',
        }),
    })
      .strict()
      .messages({
        'object.unknown': 'Invalid field: {#label}',
        'object.base': 'Must be an object with currencies and referrerDailyRewardLimit',
      }),

    // referral: Joi.object().pattern(
    //   Joi.string().valid('virtual1', 'virtual2') // Only allow these keys
    //     .messages({'any.only': 'Only virtual1 and virtual2 currencies allowed'}),
    //   Joi.object({
    //     referreeReward: Joi.number().min(0).required()
    //       .messages({'number.base': 'Referree reward must be a number'}),
    //     referrerReward: Joi.number().min(0).required()
    //       .messages({'number.base': 'Referrer reward must be a number'})
    //   }).strict().messages({
    //     'object.unknown': 'Invalid field in referral: {#label}',
    //     'object.base': 'Each currency must have referreeReward and referrerReward'
    //   })
    // ).messages({
    //   'object.base': 'Must be an object with currency keys'
    // })
  }

  const validate = () => {
  try {
    const parsed = JSON.parse(stringValue)
    error = null

    // Determine which schema to use based on the structure
    let schemaToUse
    if (typeof parsed.virtual1 === 'number' && typeof parsed.virtual2 === 'number') {
      schemaToUse = schemas.joinReward
    } else if (typeof parsed.virtual1 === 'object' || typeof parsed.virtual2 === 'object') {
      schemaToUse = schemas.referral
    } else if (typeof parsed.day_limit === 'number' && typeof parsed.min_withdraw === 'number') {
      schemaToUse = schemas.walletWithdraw
    } else if (Array.isArray(parsed.rewards)) {
      schemaToUse = schemas.leaderboardRewards
    } else {
      error = 'Invalid structure - must be either joinReward, referral, walletWithdraw, or leaderboardRewards format'
      return { valid: false }
    }

    const { error: validationError } = schemaToUse.validate(parsed, {
      allowUnknown: false,
      abortEarly: false,
    })

    if (validationError) {
      error = validationError.details.map((d) => d.message).join(', ')
      return { valid: false }
    }

    return { valid: true, value: parsed }
  } catch (e) {
    error = 'Invalid JSON format'
    return { valid: false }
  }
}


  const handleInput = () => {
    // Clear error when user starts typing
    if (error) error = null
  }

  const handleSave = async () => {
    const validation = validate()
    if (!validation.valid) return

    isSaving = true
    try {
      await onSave(validation.value)
      error = null
    } catch (err) {
      error = err.message || 'Failed to save'
    } finally {
      isSaving = false
    }
  }
</script>

<div class="json-editor">
  <textarea
    bind:value={stringValue}
    on:input={handleInput}
    on:blur={validate}
    class:invalid={error}
    rows={10}
    disabled={isSaving}
  ></textarea>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  <button on:click={handleSave} disabled={isSaving || error}>
    {isSaving ? 'Saving...' : 'Save'}
  </button>
</div>

<style>
  .json-editor {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  textarea {
    width: 100%;
    font-family: monospace;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    min-height: 100px;
  }

  .invalid {
    border-color: red;
  }

  .error {
    color: red;
    font-size: 0.8rem;
  }

  button {
    align-self: flex-end;
    padding: 6px 12px;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #45a049;
  }

  button:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
</style>
