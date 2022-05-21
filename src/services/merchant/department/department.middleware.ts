import { Joi } from "celebrate";
import { autoInjectable } from "tsyringe";
@autoInjectable()
export default class DepartmentMiddleware {
  public readonly createSchema = Joi.object({
    name: Joi.string().required().min(2),
  });
  public readonly updateSchema = Joi.object({
    name: Joi.string().min(2),
  });
}
