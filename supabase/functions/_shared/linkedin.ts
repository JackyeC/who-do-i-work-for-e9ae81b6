// LinkedIn API constants and helpers
export const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
export const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
export const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
export const LINKEDIN_POSTS_URL = 'https://api.linkedin.com/v2/posts';
export const LINKEDIN_IMAGES_URL = 'https://api.linkedin.com/rest/images';

export const LINKEDIN_SCOPES = 'openid profile email w_member_social';

export function getLinkedInAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: LINKEDIN_SCOPES,
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`LinkedIn token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function getLinkedInProfile(accessToken: string): Promise<{
  sub: string;
  name: string;
  email: string;
  picture: string;
}> {
  const res = await fetch(LINKEDIN_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`LinkedIn profile fetch failed: ${await res.text()}`);
  return res.json();
}

// Register an image upload and get the upload URL
export async function initializeImageUpload(
  accessToken: string,
  personUrn: string
): Promise<{ uploadUrl: string; imageUrn: string }> {
  const res = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202401',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: personUrn,
      },
    }),
  });
  if (!res.ok) throw new Error(`LinkedIn image upload init failed: ${await res.text()}`);
  const data = await res.json();
  return {
    uploadUrl: data.value.uploadUrl,
    imageUrn: data.value.image,
  };
}

// Upload the actual image bytes
export async function uploadImage(uploadUrl: string, imageBytes: Uint8Array): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/png',
    },
    body: imageBytes,
  });
  if (!res.ok) throw new Error(`LinkedIn image upload failed: ${res.status}`);
}

// Create a LinkedIn post with optional image
export async function createLinkedInPost(
  accessToken: string,
  personUrn: string,
  text: string,
  imageUrn?: string
): Promise<string> {
  const body: Record<string, unknown> = {
    author: personUrn,
    commentary: text,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  if (imageUrn) {
    body.content = {
      media: {
        title: 'PeoplePuzzles Certificate',
        id: imageUrn,
      },
    };
  }

  const res = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202401',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`LinkedIn post creation failed: ${await res.text()}`);

  // Post ID is in the x-restli-id header
  return res.headers.get('x-restli-id') || 'unknown';
}
