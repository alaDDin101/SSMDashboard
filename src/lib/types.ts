export interface ImageUploadResponseDto {
  url: string;
}

export interface TokenResponseDto {
  accessToken: string;
  expiresAt: string;
  userId: string;
  email: string | null;
  roles: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ArticleTitleSearchItemDto {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  summary?: string | null;
  coverImageUrl?: string | null;
}

export interface SliderSlideDto {
  id: string;
  backgroundImageUrl: string | null;
  title: string | null;
  subtitle: string | null;
  contentHtml: string | null;
  linkTargetType: number;
  articleId: string | null;
  articleTitle: string | null;
  articleSlug: string | null;
  externalUrl: string | null;
  openInNewTab: boolean;
  displayOrder: number;
  isActive: boolean;
  titleColor?: string | null;
  subtitleTextColor?: string | null;
  subtitleBadgeBackgroundColor?: string | null;
  subtitleBadgeBorderColor?: string | null;
  contentHtmlColor?: string | null;
  ctaBackgroundColor?: string | null;
  ctaTextColor?: string | null;
  navArrowBackgroundColor?: string | null;
  navArrowIconColor?: string | null;
  dotActiveColor?: string | null;
  dotInactiveColor?: string | null;
  overlayBottomColor?: string | null;
  overlayMiddleColor?: string | null;
  overlayTopColor?: string | null;
}

export interface SliderSlideUpsertDto {
  backgroundImageUrl: string | null;
  title: string | null;
  subtitle: string | null;
  contentHtml: string | null;
  linkTargetType: number;
  articleId: string | null;
  externalUrl: string | null;
  openInNewTab: boolean;
  displayOrder: number;
  isActive: boolean;
  titleColor?: string | null;
  subtitleTextColor?: string | null;
  subtitleBadgeBackgroundColor?: string | null;
  subtitleBadgeBorderColor?: string | null;
  contentHtmlColor?: string | null;
  ctaBackgroundColor?: string | null;
  ctaTextColor?: string | null;
  navArrowBackgroundColor?: string | null;
  navArrowIconColor?: string | null;
  dotActiveColor?: string | null;
  dotInactiveColor?: string | null;
  overlayBottomColor?: string | null;
  overlayMiddleColor?: string | null;
  overlayTopColor?: string | null;
}

export interface CategoryCardDto {
  id: string;
  name: string;
  slug: string;
  backgroundImageUrl: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface CategoryUpsertDto {
  name: string;
  slug: string;
  backgroundImageUrl: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface ArticleListItemDto {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  categoryId: string;
  categoryName: string;
  viewCount: number;
  createdAt: string;
}

export interface ArticleDetailDto {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  bodyHtml: string;
  coverImageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  categoryId: string;
  categoryName: string;
  authorDisplayName: string | null;
  likedByCurrentUser: boolean;
  comments: PagedResult<ArticleCommentDto>;
  likedUsers: PagedResult<ArticleLikeUserDto>;
}

export interface ArticleCommentDto {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  userDisplayName: string | null;
  parentCommentId: string | null;
  isApproved: boolean;
  replies: ArticleCommentDto[];
}

export interface ArticleLikeUserDto {
  userId: string;
  userDisplayName: string | null;
  userEmail: string | null;
  likedAt: string;
}

export interface ArticleUpsertDto {
  categoryId: string;
  title: string;
  slug: string;
  summary: string | null;
  bodyHtml: string;
  coverImageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
}

export interface SocialLinkDto {
  id: string;
  platformKey: string;
  label: string | null;
  url: string;
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface SocialLinkUpsertDto {
  platformKey: string;
  label: string | null;
  url: string;
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface AboutUsSettingsDto {
  title: string;
  leadText: string | null;
  bodyHtml: string;
  imageUrl: string | null;
  isVisible: boolean;
  sectionBackgroundColor: string | null;
  cardBackgroundColor: string | null;
  accentColor: string | null;
  headingTextColor: string | null;
  bodyTextColor: string | null;
  mutedTextColor: string | null;
  updatedAt: string;
}

export type AboutUsUpsertDto = Omit<AboutUsSettingsDto, "updatedAt">;

export interface OrganizationalStructureSettingsDto {
  title: string;
  leadText: string | null;
  introHtml: string | null;
  isVisible: boolean;
  updatedAt: string;
}

export type OrganizationalStructureSettingsUpsertDto = Omit<OrganizationalStructureSettingsDto, "updatedAt">;

export interface OrgStructureNodeDto {
  id: string;
  /** 0 = لجنة/إدارة، 1 = منصب */
  kind: number;
  name: string;
  description: string | null;
  holderName: string | null;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  updatedAt: string;
}

export interface OrgStructureNodeUpsertDto {
  id?: string | null;
  kind: number;
  name: string;
  description?: string | null;
  holderName?: string | null;
  parentId?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface ProjectsPageSettingsDto {
  title: string;
  leadText: string | null;
  introHtml: string | null;
  isVisible: boolean;
  updatedAt: string;
}

export type ProjectsPageSettingsUpsertDto = Omit<ProjectsPageSettingsDto, "updatedAt">;

export interface ProjectListItemDto {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  section: number;
  sectionName: string;
  displayOrder: number;
  isPublished: boolean;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
}

export interface ProjectDetailDto {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  bodyHtml: string;
  coverImageUrl: string | null;
  section: number;
  sectionName: string;
  displayOrder: number;
  isPublished: boolean;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string | null;
  authorDisplayName: string | null;
}

export interface ProjectUpsertDto {
  section: number;
  title: string;
  slug: string;
  summary: string | null;
  bodyHtml: string;
  coverImageUrl: string | null;
  displayOrder: number;
  isPublished: boolean;
  publishedAt: string | null;
}

export interface CommentModerationItemDto {
  id: string;
  articleId: string;
  articleTitle: string;
  body: string;
  isApproved: boolean;
  isDeleted: boolean;
  createdAt: string;
  userId: string;
  userEmail: string | null;
}

/** Identity API — see DASHBOARD_IDENTITY_APIS.md */
export interface PermissionDto {
  id: string;
  name: string;
  description: string | null;
}

export interface RoleListItemDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  permissionCount: number;
}

export interface RoleDetailDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  isSystemRole: boolean;
  permissions: PermissionDto[];
}

export interface CreateRoleDto {
  name: string;
  description: string | null;
  permissionNames: string[];
}

export interface UpdateRoleDto {
  name: string | null;
  description: string | null;
}

export interface SetRolePermissionsDto {
  permissionNames: string[];
}

export interface UserListItemDto {
  id: string;
  email: string;
  displayName: string | null;
  emailConfirmed: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  roles: string[];
}

export interface UserDetailDto {
  id: string;
  email: string;
  displayName: string | null;
  profileImageUrl: string | null;
  emailConfirmed: boolean;
  lockoutEnd: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  roles: string[];
}

export interface CreateUserDto {
  email: string;
  password: string;
  displayName: string | null;
  roleNames: string[];
}

export interface UpdateUserDto {
  email: string | null;
  displayName: string | null;
  emailConfirmed: boolean | null;
}

export interface AdminSetPasswordDto {
  newPassword: string;
}

export interface AssignUserRolesDto {
  roleNames: string[];
}

export interface SetUserActiveDto {
  isActive: boolean;
}

export interface MembershipJoinRequestListItemDto {
  userId: string;
  firstName: string;
  fatherName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  email: string;
  phoneNumber: string;
  city: string;
  address: string | null;
  preferredContactMethod: string;
  educationLevel: string;
  specialization: string;
  currentProfession: string;
  employer: string | null;
  joinReason: string;
  previouslyAffiliated: boolean;
  previousAffiliationDetails: string | null;
  participationAreas: string;
  focusIssues: string;
  skills: string;
  previousExperiences: string | null;
  languages: string;
  weeklyVolunteerHours: string;
  fieldWorkReady: boolean;
  mobilityTravelAbility: string;
  commitToPrinciples: boolean;
  infoIsAccurate: boolean;
  acceptPrivacyPolicy: boolean;
  requestedAt: string;
}
