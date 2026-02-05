/**
 * Tribes Screen
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tribe } from '../../types';
import { apiClient } from '../../api/client';
import { storageService, PREF_KEYS } from '../../utils/StorageService';
import './TribesScreen.css';

const TRIBES: Tribe[] = [
  {
    id: 'trans_fem',
    topic: 'trans_fem',
    name: 'Trans Femme',
    description: 'Support and community for trans women and transfeminine people',
    icon: '🦋',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'trans_masc',
    topic: 'trans_masc',
    name: 'Trans Masc',
    description: 'Support and community for trans men and transmasculine people',
    icon: '🌟',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'nonbinary',
    topic: 'nonbinary',
    name: 'Non-Binary',
    description: 'Community for non-binary, genderqueer, and gender diverse folks',
    icon: '✨',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'bipoc_queer',
    topic: 'bipoc_queer',
    name: 'BIPOC Queer',
    description: 'Intersectional space for BIPOC LGBTQ+ individuals',
    icon: '🌈',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'queer_parents',
    topic: 'queer_parents',
    name: 'Queer Parents',
    description: 'LGBTQ+ parents and those considering parenthood',
    icon: '👨‍👩‍👧',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'newly_out',
    topic: 'newly_out',
    name: 'Newly Out',
    description: 'Support for those recently out or questioning',
    icon: '🌱',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'queer_gamers',
    topic: 'queer_gamers',
    name: 'Queer Gamers',
    description: 'Gaming community for LGBTQ+ players',
    icon: '🎮',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'queer_artists',
    topic: 'queer_artists',
    name: 'Queer Artists',
    description: 'Creative space for LGBTQ+ artists and makers',
    icon: '🎨',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'queer_faith',
    topic: 'queer_faith',
    name: 'Queer Faith',
    description: 'Spirituality and faith for LGBTQ+ individuals',
    icon: '🕊️',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'queer_sober',
    topic: 'queer_sober',
    name: 'Queer Sober',
    description: 'Sober and recovery support in the LGBTQ+ community',
    icon: '💪',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'ace_aro',
    topic: 'ace_aro',
    name: 'Ace/Aro Spectrum',
    description: 'Community for asexual and aromantic folks',
    icon: '🖤',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'elder_queer',
    topic: 'elder_queer',
    name: 'Elder Queer',
    description: 'Community for LGBTQ+ elders and older adults',
    icon: '🌟',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'youth_queer',
    topic: 'youth_queer',
    name: 'Queer Youth',
    description: 'Support for LGBTQ+ young people and teens',
    icon: '🌻',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'intersex',
    topic: 'intersex',
    name: 'Intersex Community',
    description: 'Support and connection for intersex individuals',
    icon: '💜',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'polyam_queer',
    topic: 'polyam_queer',
    name: 'Polyam Queer',
    description: 'Polyamorous LGBTQ+ relationships and community',
    icon: '💕',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'neurodivergent_queer',
    topic: 'neurodivergent_queer',
    name: 'Neurodivergent & Queer',
    description: 'Intersection of neurodiversity and LGBTQ+ identity',
    icon: '🧠',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'disabled_queer',
    topic: 'disabled_queer',
    name: 'Disabled & Queer',
    description: 'Disability justice in the LGBTQ+ community',
    icon: '♿',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'rural_queer',
    topic: 'rural_queer',
    name: 'Rural Queer',
    description: 'LGBTQ+ folks in rural and small-town areas',
    icon: '🌾',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'immigrant_queer',
    topic: 'immigrant_queer',
    name: 'Immigrant & Queer',
    description: 'Support for LGBTQ+ immigrants and refugees',
    icon: '🌍',
    memberCount: 0,
    isJoined: false,
  },
];

export const TribesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [tribes, setTribes] = useState<Tribe[]>(TRIBES);
  const [joinedTribes, setJoinedTribes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadJoinedTribes();
  }, []);

  const loadJoinedTribes = async () => {
    const joined = await storageService.get<string[]>(PREF_KEYS.JOINED_TRIBES, []);
    setJoinedTribes(new Set(joined as string[]));
    
    setTribes(prev =>
      prev.map(tribe => ({
        ...tribe,
        isJoined: (joined as string[]).includes(tribe.id),
      }))
    );
  };

  const handleToggleTribe = async (tribeId: string) => {
    const isJoined = joinedTribes.has(tribeId);
    
    if (isJoined) {
      // Leave tribe
      joinedTribes.delete(tribeId);
    } else {
      // Join tribe
      joinedTribes.add(tribeId);
      try {
        await apiClient.createBeacon({ topic: tribeId });
      } catch (error) {
        console.error('[Tribes] Failed to create beacon:', error);
      }
    }

    setJoinedTribes(new Set(joinedTribes));
    await storageService.set(PREF_KEYS.JOINED_TRIBES, Array.from(joinedTribes));
    
    setTribes(prev =>
      prev.map(tribe =>
        tribe.id === tribeId ? { ...tribe, isJoined: !isJoined } : tribe
      )
    );
  };

  return (
    <div className="tribes-screen">
      <div className="tribes-header">
        <h1>Tribes</h1>
        <p>Join topic-based communities anonymously</p>
      </div>

      <div className="tribes-list">
        {tribes.map(tribe => (
          <div 
            key={tribe.id} 
            className={`tribe-card ${tribe.isJoined ? 'tribe-card-joined' : ''}`}
            onClick={() => tribe.isJoined && navigate(`/tribes/${tribe.id}`)}
            style={{ cursor: tribe.isJoined ? 'pointer' : 'default' }}
          >
            <div className="tribe-icon">{tribe.icon}</div>
            <div className="tribe-info">
              <h3>{tribe.name}</h3>
              <p>{tribe.description}</p>
              {tribe.isJoined && (
                <span className="tribe-badge">💬 Community Active</span>
              )}
            </div>
            <button
              className={`tribe-button ${tribe.isJoined ? 'tribe-button-joined' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTribe(tribe.id);
              }}
            >
              {tribe.isJoined ? 'Leave' : 'Join'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
