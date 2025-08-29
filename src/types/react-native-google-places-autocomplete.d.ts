declare module "react-native-google-places-autocomplete" {
  import React from "react";
  import { TextInputProps, ViewStyle, TextStyle } from "react-native";

  export interface GooglePlacesAutocompleteProps {
    placeholder?: string;
    onPress: (
      data: any,
      details?: any | null
    ) => void;
    query: {
      key: string;
      language?: string;
      types?: string;
      components?: string;
      [key: string]: any;
    };
    fetchDetails?: boolean;
    styles?: {
      container?: ViewStyle;
      textInputContainer?: ViewStyle;
      textInput?: TextStyle;
      listView?: ViewStyle;
      row?: ViewStyle;
      separator?: ViewStyle;
      description?: TextStyle;
      predefinedPlacesDescription?: TextStyle;
    };
    debounce?: number;
    enablePoweredByContainer?: boolean;
    nearbyPlacesAPI?: string;
    renderLeftButton?: () => React.ReactNode;
    renderRightButton?: () => React.ReactNode;
    minLength?: number;
    [key: string]: any;
  }

  export class GooglePlacesAutocomplete extends React.Component<GooglePlacesAutocompleteProps> {}
  export default GooglePlacesAutocomplete;
}
