
import { configStore } from '../store/ConfigStore';

export const reduxService = {
  select: async (path: string) => {
    // path is like 'state.llm.providers'
    const cleanPath = path.replace('state.', '');
    const state = configStore.getState();
    
    try {
        return cleanPath.split('.').reduce((o, i) => o?.[i], state);
    } catch (e) {
        return undefined;
    }
  }
};
