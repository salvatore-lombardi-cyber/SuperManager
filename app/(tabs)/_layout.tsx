import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="camera" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventario',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="archive" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabBarIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const icons: { [key: string]: string } = {
    home: '🏠',
    camera: '📷',
    archive: '📦',
  };
  
  return (
    <View style={{ 
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ scale: focused ? 1.1 : 1 }],
    }}>
      <Text style={{ 
        fontSize: 20, 
        opacity: focused ? 1 : 0.6,
      }}>
        {icons[name] || '❓'}
      </Text>
    </View>
  );
}