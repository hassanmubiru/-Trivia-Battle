declare module 'react-native' {
  import * as React from 'react';
  
  export type ViewStyle = any;
  export type TextStyle = any;
  export type StyleProp<T> = T | any[];
  
  export interface ViewProps extends React.PropsWithChildren {
    style?: StyleProp<ViewStyle>;
    [key: string]: any;
  }
  
  export interface TextProps extends React.PropsWithChildren {
    style?: StyleProp<TextStyle>;
    [key: string]: any;
  }
  
  export interface TextInputProps extends React.PropsWithChildren {
    placeholder?: string;
    placeholderTextColor?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    editable?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    onFocus?: () => void;
    onBlur?: () => void;
    style?: StyleProp<TextStyle>;
    [key: string]: any;
  }
  
  export interface ActivityIndicatorProps {
    size?: 'small' | 'large' | number;
    color?: string;
    [key: string]: any;
  }
  
  export const View: React.FC<ViewProps>;
  export const Text: React.FC<TextProps>;
  export const TextInput: React.FC<TextInputProps>;
  export const ActivityIndicator: React.FC<ActivityIndicatorProps>;
  export const TouchableOpacity: React.FC<any>;
  export const StyleSheet: {
    create: (styles: Record<string, any>) => Record<string, any>;
  };
}
