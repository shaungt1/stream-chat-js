import { StreamChat } from 'client';
import {
  Campaign,
  CampaignData,
  CampaignPreview,
  CampaignStatus,
  LiteralStringForUnion,
  Segment,
  SegmentData,
  UnknownType,
} from 'types';

export class CampaignsClient<
  AttachmentType extends UnknownType = UnknownType,
  ChannelType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion,
  EventType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType
> {
  private _client: StreamChat<
    AttachmentType,
    ChannelType,
    CommandType,
    EventType,
    MessageType,
    ReactionType,
    UserType
  >;

  constructor(
    client: StreamChat<
      AttachmentType,
      ChannelType,
      CommandType,
      EventType,
      MessageType,
      ReactionType,
      UserType
    >,
  ) {
    this._client = client;
  }

  async createSegment(segment: SegmentData): Promise<Segment> {
    return await this._client.post(`${this._client.baseURL}/segments`, { segment });
  }

  async getSegment(id: string): Promise<Segment> {
    const { segment } = await this._client.get<{ segment: Segment }>(
      `${this._client.baseURL}/segments/${id}`,
    );
    return segment;
  }

  async listSegments(params: {
    limit?: number;
    offset?: number;
  }): Promise<{ segments: Segment[] }> {
    return await this._client.get(`${this._client.baseURL}/segments`, params); // params are sent for dashboard pagination, maybe it would make sense to include searching/filters too
  }

  async updateSegment(id: string, params: Partial<SegmentData>): Promise<Segment> {
    const { segment } = await this._client.put<{ segment: Segment }>(
      `${this._client.baseURL}/segments/${id}`,
      params,
    );
    return segment;
  }

  async deleteSegment(id: string): Promise<void> {
    return await this._client.delete(`${this._client.baseURL}/segments/${id}`);
  }

  async createCampaign(campaign: CampaignData): Promise<Campaign> {
    return await this._client.post(`${this._client.baseURL}/campaigns`, { campaign });
  }

  async getCampaign(id: string): Promise<Campaign> {
    const { campaign } = await this._client.get<{ campaign: Campaign }>(
      `${this._client.baseURL}/campaigns/${id}`,
    );
    return campaign;
  }

  async listCampaigns(params: { limit?: number; offset?: number }): Promise<Campaign[]> {
    return await this._client.get(`${this._client.baseURL}/campaigns`, params); // params are sent for dashboard pagination, maybe it would make sense to include searching/filters too
  }

  async updateCampaign(id: string, params: Partial<CampaignData>): Promise<Campaign> {
    const { campaign } = await this._client.put<{ campaign: Campaign }>(
      `${this._client.baseURL}/campaigns/${id}`,
      params,
    );
    return campaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    return await this._client.delete(`${this._client.baseURL}/campaigns/${id}`);
  }

  async sendCampaign(
    id: string,
    params?: {
      scheduledAt?: Date;
    },
  ): Promise<CampaignStatus> {
    return await this._client.post(
      `${this._client.baseURL}/campaigns/${id}/send`,
      params,
    );
  }

  async previewCampaign(id: string, params: object): Promise<CampaignPreview> {
    // params are used to populate the templating
    return await this._client.get(
      `${this._client.baseURL}/campaigns/${id}/preview`,
      params,
    );
  }

  async getCampaignStatus(id: string): Promise<CampaignStatus> {
    return await this._client.get(`${this._client.baseURL}/campaigns/${id}/status`);
  }

  async cancelCampaign(id: string): Promise<CampaignStatus> {
    return await this._client.post(`${this._client.baseURL}/campaigns/${id}/cancel`);
  }

  async sendTestCampaign(id: string, userIds: string[]): Promise<CampaignStatus> {
    return await this._client.post(`${this._client.baseURL}/campaigns/${id}/test`, {
      userIds,
    });
  }
}
