import { required } from "./helpers.js";

/** @enum {number} */
export const Pipeline = {
  AtlassianMarketplace: parseInt(required('HUBSPOT_PIPELINE_MPAC'), 10),
};

/** @enum {number} */
export const DealStage = {
  EVAL: parseInt(required('HUBSPOT_DEALSTAGE_EVAL'), 10),
  CLOSED_WON: parseInt(required('HUBSPOT_DEALSTAGE_CLOSED_WON'), 10),
  CLOSED_LOST: parseInt(required('HUBSPOT_DEALSTAGE_CLOSED_LOST'), 10),
};
