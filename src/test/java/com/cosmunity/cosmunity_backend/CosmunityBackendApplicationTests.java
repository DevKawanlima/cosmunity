
package com.cosmunity.cosmunity_backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.MOCK
)
@ActiveProfiles("local")
class CosmunityBackendApplicationTests {

    @Test
    void contextLoads() {
        // Verifica a inicializacao do contexto Spring.
    }
}
