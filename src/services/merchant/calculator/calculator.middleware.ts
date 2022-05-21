import { Joi } from "celebrate";
import { Controller } from "common/services";
import { autoInjectable } from "tsyringe";
@autoInjectable()
export default class CalculatorMiddleware extends Controller {
  public readonly generateCummulativeSchema = Joi.object({
    reportIds: Joi.array().required().unique().items(Joi.string()),
    name: Joi.string().required(),
  });
}
