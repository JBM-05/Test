const FIGMA_ASSET_ROOT = '/assets/figma'

export const bundleBuilderAssets = {
  steps: {
    camera: `${FIGMA_ASSET_ROOT}/step-camera.svg`,
    plan: `${FIGMA_ASSET_ROOT}/step-plan.svg`,
    sensor: `${FIGMA_ASSET_ROOT}/step-sensors.svg`,
    accessory: `${FIGMA_ASSET_ROOT}/step-accessories.svg`,
  },
  carets: {
    up: `${FIGMA_ASSET_ROOT}/caret-up.svg`,
    down: `${FIGMA_ASSET_ROOT}/caret-down.svg`,
  },
  quantity: {
    minus: `${FIGMA_ASSET_ROOT}/quantity-minus.svg`,
    plus: `${FIGMA_ASSET_ROOT}/quantity-plus.svg`,
    minusDisabled: `${FIGMA_ASSET_ROOT}/quantity-minus-disabled.svg`,
    plusDisabled: `${FIGMA_ASSET_ROOT}/quantity-plus-disabled.svg`,
    cardMinus: `${FIGMA_ASSET_ROOT}/card-minus.svg`,
    cardPlus: `${FIGMA_ASSET_ROOT}/card-plus.svg`,
    cardMinusMuted: `${FIGMA_ASSET_ROOT}/card-minus-muted.svg`,
    cardPlusMuted: `${FIGMA_ASSET_ROOT}/card-plus-muted.svg`,
  },
  review: {
    planShield: `${FIGMA_ASSET_ROOT}/cam-unlimited-shield.svg`,
    delivery: `${FIGMA_ASSET_ROOT}/delivery-rendered.png`,
    satisfactionBadge: `${FIGMA_ASSET_ROOT}/satisfaction-badge-rendered.png`,
  },
} as const
