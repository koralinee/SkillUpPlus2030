import React, { useState, useEffect, createContext, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import Ionicons from "@expo/vector-icons/Ionicons";

const AuthContext = createContext();

function useAuthProvider() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("@skillup_user");
        if (saved) setUser(JSON.parse(saved));
      } catch (e) {
        console.log("Erro ao carregar usuário:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (username, password) => {
    if (!username || !password) throw new Error("Usuário e senha são obrigatórios");
    if (password.length < 4) throw new Error("Senha muito curta (mínimo 4 caracteres)");

    const userObj = {
      username,
      preferences: { area: "Inteligência Artificial" },
      progress: 25,
    };
    setUser(userObj);
    await AsyncStorage.setItem("@skillup_user", JSON.stringify(userObj));
    return userObj;
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem("@skillup_user");
  };

  const updateUser = async (patch) => {
    const updated = { ...user, ...patch };
    setUser(updated);
    await AsyncStorage.setItem("@skillup_user", JSON.stringify(updated));
  };

  return { user, loading, signIn, signOut, updateUser };
}


function AppLoading() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" />
      <Text>Carregando...</Text>
    </View>
  );
}

function ProgressBar({ value = 0 }) {
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressTrack]}>
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%` }]} />
      </View>
      <Text style={styles.progressText}>{value}% concluído</Text>
    </View>
  );
}

function LoginScreen({ navigation }) {
  const auth = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [area, setArea] = useState("Inteligência Artificial");
  const [loading, setLoading] = useState(false);

  const handleContinueSaved = () => {
    if (auth.user) {
      navigation.reset({ index: 0, routes: [{ name: "AppDrawer" }] });
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      if (!username || !password) {
        Alert.alert("Erro", "Preencha usuário e senha.");
        return;
      }
      await auth.signIn(username, password);
      await auth.updateUser({ preferences: { area } });
      navigation.reset({ index: 0, routes: [{ name: "AppDrawer" }] });
    } catch (e) {
      Alert.alert("Falha no login", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.centered}>
          <Image source={{ uri: "https://cdn.pixabay.com/photo/2017/06/13/12/53/profile-2398782_640.png" }} style={styles.logo} />
          <Text style={styles.title}>SkillUpPlus 2030+</Text>

          {}
          {auth.user ? (
            <View style={{ width: "100%", marginBottom: 12 }}>
              <Text style={{ marginBottom: 6, textAlign: "center" }}>Usuário salvo:</Text>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#4CAF50" }]}
                onPress={handleContinueSaved}
              >
                <Text style={styles.buttonText}>Continuar como {auth.user.username}</Text>
              </TouchableOpacity>

              <Text style={{ textAlign: "center", color: "#666", marginTop: 8 }}>ou faça login com outra conta</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Usuário"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.pickerWrap}>
            <Text style={{ marginBottom: 6 }}>Área de interesse:</Text>
            <View style={styles.pickerBox}>
              <Picker selectedValue={area} onValueChange={(v) => setArea(v)}>
                <Picker.Item label="Inteligência Artificial" value="Inteligência Artificial" />
                <Picker.Item label="Sustentabilidade" value="Sustentabilidade" />
                <Picker.Item label="Gestão" value="Gestão" />
                <Picker.Item label="Soft Skills" value="Soft Skills" />
                <Picker.Item label="Desenvolvimento Web" value="Desenvolvimento Web" />
              </Picker>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HomeScreen({ navigation }) {
  const auth = useContext(AuthContext);
  if (!auth.user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.heading}>Bem-vindo de volta, {auth.user.username}!</Text>
        <ProgressBar value={auth.user.progress ?? 0} />

        <Text style={styles.sectionTitle}>Sua trilha recomendada</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Introdução à {auth.user.preferences?.area ?? "Tecnologia"}</Text>
          <Text style={styles.cardText}>
            Curso rápido de 4 módulos — aprox. 3 horas no total. Ao final, você recebe recomendações personalizadas.
          </Text>
          <TouchableOpacity
            style={[styles.smallButton, { marginTop: 10 }]}
            onPress={() => navigation.navigate("CourseDetail", { courseId: "curso-intro" })}
          >
            <Text style={styles.smallButtonText}>Iniciar curso</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Sugestões</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.suggestionCard} onPress={() => navigation.navigate("Cursos")}>
            <Ionicons name="book" size={28} />
            <Text style={{ marginTop: 8 }}>Ver cursos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionCard} onPress={() => navigation.navigate("Progress")}>
            <Ionicons name="trophy" size={28} />
            <Text style={{ marginTop: 8 }}>Meu progresso</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CoursesScreen({ navigation }) {
  const [filter, setFilter] = useState("Todos");
  const sample = [
    { id: "c1", title: "IA para iniciantes", area: "Inteligência Artificial", duration: "2h" },
    { id: "c2", title: "Gestão Ágil", area: "Gestão", duration: "3h" },
    { id: "c3", title: "Sustentabilidade Prática", area: "Sustentabilidade", duration: "1.5h" },
    { id: "c4", title: "Comunicação e Feedback", area: "Soft Skills", duration: "1h" },
  ];

  const list = filter === "Todos" ? sample : sample.filter((s) => s.area === filter);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.heading}>Trilhas e Cursos</Text>
        <View style={{ marginVertical: 12 }}>
          <Picker selectedValue={filter} onValueChange={(v) => setFilter(v)}>
            <Picker.Item label="Todos" value="Todos" />
            <Picker.Item label="Inteligência Artificial" value="Inteligência Artificial" />
            <Picker.Item label="Sustentabilidade" value="Sustentabilidade" />
            <Picker.Item label="Gestão" value="Gestão" />
            <Picker.Item label="Soft Skills" value="Soft Skills" />
          </Picker>
        </View>

        {list.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.card}
            onPress={() => navigation.navigate("CourseDetail", { courseId: c.id, course: c })}
          >
            <Text style={styles.cardTitle}>{c.title}</Text>
            <Text style={styles.cardText}>{c.area} • {c.duration}</Text>
            <TouchableOpacity
              style={[styles.smallButton, { marginTop: 8 }]}
              onPress={() => navigation.navigate("CourseDetail", { courseId: c.id, course: c })}
            >
              <Text style={styles.smallButtonText}>Abrir</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function CourseDetailScreen({ route, navigation }) {
  const { courseId, course } = route.params || {};
  const auth = useContext(AuthContext);

  const handleComplete = async () => {
    const newProgress = Math.min(100, (auth.user.progress || 0) + 15);
    await auth.updateUser({ progress: newProgress });
    Alert.alert("Parabéns!", "Você concluiu o módulo e recebeu +15% de progresso.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.heading}>{course?.title ?? "Curso"}</Text>
        <Text style={{ marginVertical: 8 }}>{course?.area ?? "Área"} • Duração: {course?.duration ?? "—"}</Text>
        <View style={{ height: 12 }} />
        <Text style={{ fontWeight: "600", marginBottom: 8 }}>Descrição</Text>
        <Text style={{ color: "#444" }}>
          Este é um curso demonstrativo para a atividade A3. O objetivo é ilustrar a estrutura de trilhas curtas e o
          acompanhamento de progresso do usuário.
        </Text>

        <View style={{ height: 16 }} />
        <TouchableOpacity style={styles.button} onPress={handleComplete}>
          <Text style={styles.buttonText}>Marcar módulo como concluído</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressScreen() {
  const auth = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.heading}>Meu Progresso</Text>
        <ProgressBar value={auth.user?.progress ?? 0} />
        <Text style={{ marginTop: 12 }}>
          Pontos: {auth.user?.progress ?? 0} • Trilha atual: {auth.user?.preferences?.area ?? "—"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileScreen() {
  const auth = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.heading}>Perfil</Text>
        <View style={styles.card}>
          <Text style={{ fontWeight: "700" }}>{auth.user?.username}</Text>
          <Text style={{ marginTop: 6, color: "#555" }}>Área: {auth.user?.preferences?.area ?? "—"}</Text>
          <Text style={{ marginTop: 6, color: "#555" }}>Progresso: {auth.user?.progress ?? 0}%</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#ddd", marginTop: 12 }]}
          onPress={() => Alert.alert("Editar Perfil", "Funcionalidade de edição (pode implementar em separado).")}
        >
          <Text style={{ color: "#333" }}>Editar perfil</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.heading}>Sobre o SkillUpPlus 2030+</Text>
        <Text style={{ marginTop: 8 }}>
          Aplicativo demonstrativo desenvolvido para a atividade A3 do curso PDM I. Conecta usuários a trilhas de
          aprendizagem curtas e monitoráveis.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();

function TabsNavigator() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        const name = route.name === "Dashboard" ? "home" : route.name === "Cursos" ? "book" : "stats-chart";
        return <Ionicons name={name} size={20} color={color} />;
      }
    })}>
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Cursos" component={CoursesScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: "Progresso" }} />
    </Tab.Navigator>
  );
}

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const auth = useContext(AuthContext);
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#EEE" }}>
        <Text style={{ fontWeight: "700" }}>{auth.user?.username ?? "Visitante"}</Text>
        <Text style={{ color: "#666", fontSize: 12 }}>{auth.user?.preferences?.area ?? "Sem preferência"}</Text>
      </View>

      <View style={{ flex: 1, paddingTop: 8 }}>
        <DrawerItem label="Início" onPress={() => props.navigation.navigate("Tabs")} />
        <DrawerItem label="Cursos" onPress={() => props.navigation.navigate("Cursos")} />
        <DrawerItem label="Perfil" onPress={() => props.navigation.navigate("Perfil")} />
        <DrawerItem label="Sobre" onPress={() => props.navigation.navigate("Sobre")} />
      </View>

      <View style={{ padding: 16 }}>
        <DrawerItem label="Sair" onPress={() => props.navigation.replace("Login")} />
      </View>
    </DrawerContentScrollView>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false, title: "Início" }} />
      <Drawer.Screen name="Cursos" component={CoursesScreen} />
      <Drawer.Screen name="Perfil" component={ProfileScreen} />
      <Drawer.Screen name="Sobre" component={AboutScreen} />
    </Drawer.Navigator>
  );
}

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const auth = useContext(AuthContext);

  if (auth.loading) return <AppLoading />;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AppDrawer" component={DrawerNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: "Curso" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const auth = useAuthProvider();
  return (
    <AuthContext.Provider value={auth}>
      <RootNavigator />
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  logo: { width: 110, height: 110, marginBottom: 12, borderRadius: 12 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    marginBottom: 10,
    backgroundColor: "#FAFAFA"
  },
  button: {
    backgroundColor: "#1976D2",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "700" },
  heading: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginTop: 10, marginBottom: 6 },
  card: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEE",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  cardTitle: { fontWeight: "700", fontSize: 16 },
  cardText: { color: "#555", marginTop: 6 },
  smallButton: { backgroundColor: "#1976D2", padding: 8, borderRadius: 8, alignSelf: "flex-start" },
  smallButtonText: { color: "#FFF", fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  suggestionCard: { width: "48%", backgroundColor: "#FFF", padding: 14, alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: "#EEE" },
  progressContainer: { marginVertical: 10 },
  progressTrack: { height: 12, backgroundColor: "#EEE", borderRadius: 8, overflow: "hidden" },
  progressFill: { height: 12, backgroundColor: "#1976D2" },
  progressText: { marginTop: 6, color: "#444" },
  pickerWrap: { width: "100%", marginBottom: 10 },
  pickerBox: {
  borderWidth: 1,
  borderColor: "#EEE",
  borderRadius: 8,
  overflow: "hidden",
  minHeight: 50,      
  justifyContent: "center",
},

});
