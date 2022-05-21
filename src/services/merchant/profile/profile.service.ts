import { UserEntity } from "repository/entity/User";
import RepositoryService from "repository/services";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class ProfileService {
  private readonly repository = new RepositoryService<UserEntity>(UserEntity);
  constructor() {}

  public updateProfile = async (
    owner: UserEntity,
    body: any
  ): Promise<UserEntity> => {
    await this.repository.update(
      owner._id,
      this.repository.getEntityObject(body)
    );
    return await this.repository.getById(owner._id);
  };
}
