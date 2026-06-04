import React from 'react';
import { StatusBar as RNStatusBar } from 'react-native';
import { BrandColors, } from '../../constants/theme';

export default function ShowcaseStatusBar() {

  return (
    <>
      <RNStatusBar
        backgroundColor={BrandColors.primary}
        barStyle="light-content"
      />
    </>
  );
};
