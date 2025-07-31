export interface ProjectMetadata {
  title: string;
  description: string;
  liveDemo: boolean;
  techStack: string[];
  slug: string;
  sourceCode?: string;
  url?: string;
  // Icon: React.ComponentType | string; // depending on what Brain is
}


export interface ProjectCardPro{
  index: number;
  project: ProjectMetadata;

}

export interface ProjectProp{
  isFeatured?: boolean; 
}
