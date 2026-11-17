
package com.cosmunity.cosmunity_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class RateLimitFilter extends OncePerRequestFilter {

    private static final long JANELA_MS = 60_000L;

    private static final int LIMITE_REGISTROS = 10_000;

    private final Map<String, JanelaRequisicoes> requisicoes =
            new ConcurrentHashMap<>();

    private final Map<String, Integer> limites = Map.of(
            "/auth/register", 5,
            "/auth/login", 10,
            "/auth/verify-email", 10,
            "/auth/resend-code", 3,
            "/auth/forgot-password", 3,
            "/auth/reset-password", 5
    );

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String rota = request.getServletPath();

        Integer limite = limites.get(rota);

        if (!"POST".equalsIgnoreCase(request.getMethod())
                || limite == null) {

            filterChain.doFilter(request, response);
            return;
        }

        String ip = request.getRemoteAddr();

        String chave = ip + ":" + rota;

        Resultado resultado = registrarRequisicao(
                chave,
                limite
        );

        if (!resultado.permitido()) {

            response.setStatus(429);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");

            response.setHeader(
                    "Retry-After",
                    String.valueOf(resultado.aguardarSegundos())
            );

            response.getWriter().write("""
                    {
                        "erro": "Muitas requisições.",
                        "mensagem": "Limite de solicitações atingido. Tente novamente mais tarde."
                    }
                    """);

            return;
        }

        filterChain.doFilter(request, response);
    }

    private synchronized Resultado registrarRequisicao(
            String chave,
            int limite
    ) {

        long agora = System.currentTimeMillis();

        requisicoes.entrySet().removeIf(
                entrada -> agora - entrada.getValue().inicio
                        >= JANELA_MS
        );

        JanelaRequisicoes janela = requisicoes.get(chave);

        if (janela == null) {

            if (requisicoes.size() >= LIMITE_REGISTROS) {
                return new Resultado(false, 60);
            }

            janela = new JanelaRequisicoes(agora);

            requisicoes.put(chave, janela);
        }

        if (janela.quantidade >= limite) {

            long restante = JANELA_MS
                    - (agora - janela.inicio);

            long segundos = Math.max(
                    1,
                    (restante + 999) / 1000
            );

            return new Resultado(false, segundos);
        }

        janela.quantidade++;

        return new Resultado(true, 0);
    }

    private static class JanelaRequisicoes {

        private final long inicio;
        private int quantidade;

        private JanelaRequisicoes(long inicio) {
            this.inicio = inicio;
            this.quantidade = 0;
        }
    }

    private record Resultado(
            boolean permitido,
            long aguardarSegundos
    ) {
    }
}