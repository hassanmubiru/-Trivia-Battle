declare module 'react-native' {
  import * as React from 'react';
  
  export interface ViewProps extends React.PropsWithChildren {
    style?: any;
    [key: string]: any;
  }
  
  export interface TextProps extends React.PropsWithChildren {
    style?: any;
    [key: string]: any;
  }
  
  export interface ActivityIndicatorProps {
    size?: 'small' | 'large' | number;
    color?: string;
    [key: string]: any;
  }
  
  export const View: React.FC<ViewProps>;
  export const Text: React.FC<TextProps>;
  export const ActivityIndicator: React.FC<ActivityIndicatorProps>;
  export const TouchableOpacity: React.FC<any>;
  export const StyleSheet: any;
}
