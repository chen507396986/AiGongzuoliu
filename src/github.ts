import { Octokit } from '@octokit/rest';

const GIST_DESCRIPTION = 'AI Workflow Backup (Trae AI)';
const GIST_FILENAME = 'workflow.json';

export interface GitHubUser {
  login: string;
  avatar_url: string;
}

export class GitHubService {
  private octokit: Octokit | null = null;
  private token: string | null = null;

  constructor() {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      this.setToken(savedToken);
    }
  }

  setToken(token: string) {
    this.token = token;
    this.octokit = new Octokit({ auth: token });
    localStorage.setItem('github_token', token);
  }

  logout() {
    this.token = null;
    this.octokit = null;
    localStorage.removeItem('github_token');
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  async getUser(): Promise<GitHubUser> {
    if (!this.octokit) throw new Error('Not logged in');
    const { data } = await this.octokit.users.getAuthenticated();
    return {
      login: data.login,
      avatar_url: data.avatar_url,
    };
  }

  async saveToRepo(content: string): Promise<void> {
    if (!this.octokit) throw new Error('Not logged in');

    const REPO_OWNER = 'chen507396986';
    const REPO_NAME = 'AiGongzuoliu';
    const FILE_PATH = 'public/workflow-data.json'; // Save to public folder so it can be served/viewed
    const MESSAGE = 'chore: update workflow data via app';

    try {
      // 1. Get current file SHA (if exists)
      let sha: string | undefined;
      try {
        const { data } = await this.octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: FILE_PATH,
        });
        if ('sha' in data) {
          sha = data.sha;
        }
      } catch (e) {
        // File doesn't exist yet, which is fine
      }

      // 2. Create or Update file
      await this.octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: FILE_PATH,
        message: MESSAGE,
        content: btoa(unescape(encodeURIComponent(content))), // Handle UTF-8 to Base64
        sha: sha,
      });

    } catch (error) {
      console.error('Failed to save to repo:', error);
      throw new Error('Failed to save to repository');
    }
  }

  async saveToGist(content: string): Promise<string> {
    if (!this.octokit) throw new Error('Not logged in');

    // 1. Check if we already have a gist for this
    // We can store the gist ID in localStorage to update the same one
    const savedGistId = localStorage.getItem('workflow_gist_id');

    if (savedGistId) {
      try {
        await this.octokit.gists.update({
          gist_id: savedGistId,
          files: {
            [GIST_FILENAME]: {
              content,
            },
          },
        });
        return savedGistId;
      } catch (error) {
        console.warn('Failed to update existing gist, creating new one', error);
        // Fall through to create new gist
      }
    }

    // 2. Create new gist
    const { data } = await this.octokit.gists.create({
      description: GIST_DESCRIPTION,
      public: false, // Secret gist by default
      files: {
        [GIST_FILENAME]: {
          content,
        },
      },
    });

    if (data.id) {
        localStorage.setItem('workflow_gist_id', data.id);
        return data.id;
    }
    throw new Error('Failed to create gist');
  }

  async loadFromGist(): Promise<string> {
    if (!this.octokit) throw new Error('Not logged in');

    const savedGistId = localStorage.getItem('workflow_gist_id');
    if (!savedGistId) {
        // Try to find it in user's gists
        const { data: gists } = await this.octokit.gists.list();
        const found = gists.find(g => g.description === GIST_DESCRIPTION);
        if (found && found.id) {
            localStorage.setItem('workflow_gist_id', found.id);
            // Recursively call with the found ID
            return this.loadFromGist();
        }
        throw new Error('No saved workflow found on GitHub');
    }

    const { data } = await this.octokit.gists.get({ gist_id: savedGistId });
    const file = data.files?.[GIST_FILENAME];
    
    if (file && file.content) {
        return file.content;
    }
    throw new Error('Gist found but file content is missing');
  }

  async loadGistById(id: string): Promise<string> {
    // 1. Try authenticated if available
    if (this.octokit) {
      try {
        const { data } = await this.octokit.gists.get({ gist_id: id });
        const file = data.files?.[GIST_FILENAME];
        if (file && file.content) return file.content;
      } catch (e) {
        console.warn('Authenticated load failed, trying public fetch', e);
      }
    }

    // 2. Fallback to unauthenticated fetch (for shared links)
    const res = await fetch(`https://api.github.com/gists/${id}`);
    if (!res.ok) throw new Error('Failed to load Gist (Not Found or Private)');
    const data = await res.json();
    const file = data.files?.[GIST_FILENAME];
    if (file && file.content) return file.content;
    
    throw new Error('Gist found but workflow.json is missing');
  }

  async fetchChangelog(): Promise<string> {
    const REPO_OWNER = 'chen507396986';
    const REPO_NAME = 'AiGongzuoliu';
    const BRANCH = 'main';

    // 1. Try authenticated API call if logged in (works for private repos)
    if (this.octokit) {
      try {
        const { data } = await this.octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: 'CHANGELOG.md',
          ref: BRANCH
        });
        
        // Content is base64 encoded
        if ('content' in data && typeof data.content === 'string') {
          return decodeURIComponent(escape(atob(data.content)));
        }
      } catch (e) {
        console.warn('Authenticated fetch failed, falling back to raw URL', e);
      }
    }

    // 2. Fallback to public raw URL (works for public repos without login)
    // Add timestamp to prevent caching
    const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/CHANGELOG.md?t=${Date.now()}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch CHANGELOG.md');
    return await res.text();
  }
}

export const githubService = new GitHubService();
