/**
 * Tribe Community Board Screen
 * Encrypted social feed for tribe members
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { storageService } from '../../utils/StorageService';
import './TribeCommunityScreen.css';

interface Post {
  id: string;
  author_hash: string;
  content: string;
  created_at: string;
  reply_count: number;
  reactions: {
    heart: number;
    support: number;
    celebrate: number;
  };
}

export const TribeCommunityScreen: React.FC = () => {
  const { tribeId } = useParams<{ tribeId: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  const tribeNames: Record<string, { name: string; icon: string }> = {
    trans_fem: { name: 'Trans Femme', icon: '🦋' },
    trans_masc: { name: 'Trans Masc', icon: '🌟' },
    nonbinary: { name: 'Non-Binary', icon: '✨' },
    bipoc_queer: { name: 'BIPOC Queer', icon: '🌈' },
    queer_parents: { name: 'Queer Parents', icon: '👨‍👩‍👧' },
    newly_out: { name: 'Newly Out', icon: '🌱' },
    queer_gamers: { name: 'Queer Gamers', icon: '🎮' },
    queer_artists: { name: 'Queer Artists', icon: '🎨' },
    queer_faith: { name: 'Queer Faith', icon: '🕊️' },
    queer_sober: { name: 'Queer Sober', icon: '💪' },
    ace_aro: { name: 'Ace/Aro Spectrum', icon: '🖤' },
    elder_queer: { name: 'Elder Queer', icon: '🌟' },
    youth_queer: { name: 'Queer Youth', icon: '🌻' },
    intersex: { name: 'Intersex Community', icon: '💜' },
    polyam_queer: { name: 'Polyam Queer', icon: '💕' },
    neurodivergent_queer: { name: 'Neurodivergent & Queer', icon: '🧠' },
    disabled_queer: { name: 'Disabled & Queer', icon: '♿' },
    rural_queer: { name: 'Rural Queer', icon: '🌾' },
    immigrant_queer: { name: 'Immigrant & Queer', icon: '🌍' },
  };

  const tribe = tribeId ? tribeNames[tribeId] : null;

  useEffect(() => {
    if (tribeId) {
      loadPosts();
      // Refresh every 10 seconds
      const interval = setInterval(loadPosts, 10000);
      return () => clearInterval(interval);
    }
  }, [tribeId]);

  const loadPosts = async () => {
    try {
      if (tribeId) {
        const fetchedPosts = await apiClient.getTribePosts(tribeId);
        setPosts(fetchedPosts);
      }
    } catch (error) {
      console.error('[TribeCommunity] Failed to load posts:', error);
      // Keep existing posts on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      alert('Please enter some content');
      return;
    }

    setPosting(true);
    try {
      // Would call API in production
      const newPost: Post = {
        id: Date.now().toString(),
        author_hash: 'anon_' + Math.random().toString(36).substring(7),
        content: newPostContent,
        created_at: new Date().toISOString(),
        reply_count: 0,
        reactions: { heart: 0, support: 0, celebrate: 0 },
      };

      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setShowNewPost(false);
      
      // In production, would call:
      // await apiClient.createTribePost(tribeId, { content: newPostContent });
    } catch (error) {
      console.error('[TribeCommunity] Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setPosting(false);
    }
  };
if (tribeId) {
        await apiClienasync (postId: string, reactionType: 'heart' | 'support' | 'celebrate') => {
    try {
      await apiClient.reactToPost(Number(postId), reactionType);
      // Reload to get updated counts
      await loadPosts();
    } catch (error) {
      console.error('[TribeCommunity] Failed to react:', error);
    }t hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!tribe) {
    return (
      <div className="tribe-community-screen">
        <div className="tribe-error">
          <p>Tribe not found</p>
          <button onClick={() => navigate('/tribes')}>Back to Tribes</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tribe-community-screen">
      <div className="tribe-community-header">
        <button className="back-button" onClick={() => navigate('/tribes')}>
          ← Back
        </button>
        <div className="tribe-title">
          <span className="tribe-icon-large">{tribe.icon}</span>
          <h1>{tribe.name}</h1>
        </div>
        <button className="new-post-button" onClick={() => setShowNewPost(true)}>
          + Post
        </button>
      </div>

      {showNewPost && (
        <div className="new-post-modal-overlay" onClick={() => setShowNewPost(false)}>
          <div className="new-post-modal" onClick={(e) => e.stopPropagation()}>
            <div className="new-post-header">
              <h2>Create Post</h2>
              <button onClick={() => setShowNewPost(false)}>×</button>
            </div>
            <textarea
              className="new-post-textarea"
              placeholder="Share with the community... (Anonymous)"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={6}
              autoFocus
            />
            <div className="new-post-footer">
              <p className="anonymity-note">
                🔒 All posts are encrypted and anonymous
              </p>
              <button
                className="post-submit-button"
                onClick={handleCreatePost}
                disabled={posting || !newPostContent.trim()}
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="tribe-community-content">
        {loading ? (
          <div className="loading-state">
            <p>Loading community posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">💬</span>
            <h3>No posts yet</h3>
            <p>Be the first to share with the {tribe.name} community!</p>
            <button className="create-first-post" onClick={() => setShowNewPost(true)}>
              Create First Post
            </button>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-author">
                    <div className="author-avatar">👤</div>
                    <div>
                      <span className="author-name">Anonymous</span>
                      <span className="post-time">{formatTimeAgo(post.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="post-content">
                  <p>{post.content}</p>
                </div>
                <div className="post-actions">
                  <button
                    className="reaction-button"
                    onClick={() => handleReact(post.id, 'heart')}
                  >
                    ❤️ {post.reactions.heart}
                  </button>
                  <button
                    className="reaction-button"
                    onClick={() => handleReact(post.id, 'support')}
                  >
                    🤗 {post.reactions.support}
                  </button>
                  <button
                    className="reaction-button"
                    onClick={() => handleReact(post.id, 'celebrate')}
                  >
                    🎉 {post.reactions.celebrate}
                  </button>
                  <button className="reply-button">
                    💬 {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
